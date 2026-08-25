import { Service } from "abstract/service";
import { BatchRepository } from "./batch.repository";
import type { Batch, BatchInsert, BatchLookup } from "./batch.schema";
import { StatusTransitionRepository } from "features/statusTransitions/statusTransition.repository";
import { UserRepository } from "features/users/user.repository";
import { transaction } from "db";
import { DefectRepository } from "features/defects/defect.repository";
import { DeviceRepository } from "features/devices/devices.repository";
import { BatchTransitionRepository } from "features/batchTransitions/batchTransitions.repository";
import type { BatchTransitionInsert } from "features/batchTransitions/batchTransitions.schema";
import { ProductRepository } from "features/products/product.repository";
import { ShiftRepository } from "features/shifts/shift.repository";
import type { Defect, DefectInsert } from "features/defects/defect.schema";
import { BatchStatusRepository } from "features/batchStatuses/batchStatus.repository";
import logger from "logger";

export class BatchService extends Service<Batch, BatchInsert, BatchLookup, BatchRepository> {
  private statusTransitionRepository: StatusTransitionRepository;
  private userRepository: UserRepository;
  private defectRepository: DefectRepository;
  private deviceRepository: DeviceRepository;
  private batchTransitionsRepository: BatchTransitionRepository;
  private productRepository: ProductRepository;
  private shiftRepository: ShiftRepository;
  private statusRepository: BatchStatusRepository;

  constructor(
    repo: BatchRepository = new BatchRepository(),
    statusTransitionRepository: StatusTransitionRepository = new StatusTransitionRepository(),
    userRepository: UserRepository = new UserRepository(),
    defectRepository: DefectRepository = new DefectRepository(),
    deviceRepository: DeviceRepository = new DeviceRepository(),
    batchTransitionRepository: BatchTransitionRepository = new BatchTransitionRepository(),
    productRepository: ProductRepository = new ProductRepository(),
    shiftRepository: ShiftRepository = new ShiftRepository(),
    statusRepository: BatchStatusRepository = new BatchStatusRepository(),
  ) {
    super(repo);
    this.statusTransitionRepository = statusTransitionRepository;
    this.userRepository = userRepository;
    this.defectRepository = defectRepository;
    this.deviceRepository = deviceRepository;
    this.batchTransitionsRepository = batchTransitionRepository;
    this.productRepository = productRepository;
    this.shiftRepository = shiftRepository;
    this.statusRepository = statusRepository;
  }

  async findManyWithAll(): Promise<Batch[]> {
    const result = await this.repository.findManyWithAll();
    return result;
  }

  async findActiveByWorker(workerId: number): Promise<Batch[]> {
    return this.repository.findActiveByWorker(workerId);
  }

  async merge(batchAId: number, batchBId: number, actorId: number) {
    return transaction(async () => {

      if (batchAId === batchBId)
        throw new Error(`BatchA must not be equal to BatchB`);

      const batchA = await this.repository.find({ id: batchAId });
      const batchB = await this.repository.find({ id: batchBId });

      if (!batchA) throw new Error(`Batch ${batchAId} not found`);
      if (!batchB) throw new Error(`Batch ${batchBId} not found`);

      if (batchA.status.id !== 13) throw new Error(`Batch ${batchAId} is not in packaging`);
      if (batchB.status.id !== 13) throw new Error(`Batch ${batchBId} is not in packaging`);

      const actor = await this.userRepository.find({ id: actorId });
      if (!actor) throw new Error(`User ${actorId} not found`);

      const shift = await this.shiftRepository.findActiveByWorkerId(actor.id)
      if (!shift) throw new Error(`User ${actorId} does not have active shift`);
      if (!shift.device) throw new Error(`User ${actorId} does not have active device`);
      if (!shift.device.department) throw new Error(`No enough shift data, missing department`)
      if (shift.device.department.id !== 6) throw new Error(`Device ${shift.device.id} can not work in department ${6}`);

      const actorBatchesInProgress = await this.repository.findActiveByWorker(actorId);

      if (!actorBatchesInProgress.some((batch) => batch.id === batchAId)) 
        throw new Error(`User ${actorId} is not working on batch ${batchAId}`);
      if (!actorBatchesInProgress.some((batch) => batch.id === batchBId))
        throw new Error(`User ${actorId} is not working on batch ${batchBId}`);

      if (batchA.product.id !== batchB.product.id) throw new Error(`Batch products differ`);

      if (!batchA.size || !batchB.size) throw new Error(`Batch size error`);

      batchA.size += batchB.size;
      await this.repository.patch(batchB.id, { size: 0, status: { id: 14 }})
      await this.repository.patch(batchA.id, { size: batchA.size })
    })
  }

  async advance(
    batchId: number, 
    actorId: number, 
    coworkers: number[],
    defects: { defect_type_id: number; quantity: number }[],
    sizeOverride?: number,
    remainder?: number) {

    const IN_PROGRESS_BATCHES_LIMIT = 1;
    const PACKING_BATCHES_LIMIT = 5;

    return transaction(async () => {

      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 1. Advance started `)
      const batch = await this.repository.find({ id: batchId });

      if (!batch) throw new Error(`Batch ${batchId} not found`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 2. Batch found`)

      if (!batch.product || !batch.product.id) throw new Error(`Batch ${batchId} does not have product`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 3. Batch product present`)

      if (batch.status.isTerminal) throw new Error(`Batch ${batchId} is already in a terminal status`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 4. Batch is not terminal`)

      const statusTransition = await this.statusTransitionRepository.find({ fromStatus: { id: batch.status.id } });

      if (!statusTransition) throw new Error(`No transition defined from current status of batch ${batchId}`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 5. Status transition found`)

      const actor = await this.userRepository.find({ id: actorId });

      if (!actor) throw new Error(`User ${actorId} not found`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 6. Actor found`)

      const shift = await this.shiftRepository.findActiveByWorkerId(actor.id)

      if (!shift) throw new Error(`User ${actorId} does not have active shift`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 7. Shift found`)

      if (!shift.device) throw new Error(`User ${actorId} does not have active device`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 8. Device found`)

      if (!shift.device.department) throw new Error(`No enough shift data, missing department`)

      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 9. Device department found`)

      const from = await this.statusRepository.find({ id: statusTransition.fromStatus.id })
      const to = await this.statusRepository.find({ id: statusTransition.toStatus.id })
      if (!from || !to) throw new Error("Status error")

      statusTransition.fromStatus = from;
      statusTransition.toStatus = to;
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 10. From/To set ${JSON.stringify(from)}, ${JSON.stringify(to)} here`)

      if (statusTransition.required) {
        logger.info(`Batch: ${batchId} | Actor: ${actorId}: 11. Requirements found`)
        const requiredRole = statusTransition.required.role 
        if (requiredRole && requiredRole.id != null && requiredRole.id !== actor.role.id)
          throw new Error(`User ${actorId} does not have role required for this`);

        const requiredDepartment = statusTransition.required.department;
        if (requiredDepartment && requiredDepartment.id != null && !actor.departments?.some((d) => d.id === requiredDepartment.id))
          throw new Error(`User ${actorId} does not department role required for this`);

        if (requiredDepartment && requiredDepartment.id != null && requiredDepartment.id !== shift.device.department.id) 
          throw new Error(`Device ${shift.device.id} can not work in department ${requiredDepartment.id}`);
      } else{

        logger.info(`Batch: ${batchId} | Actor: ${actorId}: 11. No requirements`)
      }
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 12. Requirements group is over`)

      const actorBatchesInProgress = await this.repository.findActiveByWorker(actorId);
      const batchProductSums = actorBatchesInProgress.reduce<Record<number, number>>((productSums, activeBatch) => {
        const productId = activeBatch.product.id;
        if (productId != null) {
          productSums[productId] = (productSums[productId] ?? 0) + (activeBatch.size ?? 0);
        }

        return productSums;
      }, {});

      logger.info(`Batches in progress: ${actorBatchesInProgress} | Actor: ${actorId}`)
      logger.info(`Batch product sums: ${JSON.stringify(batchProductSums)} | Actor: ${actorId}`);
      const packStatus = [12, 13, 14] 
      const limit = packStatus.includes(batch.status.id) ?  PACKING_BATCHES_LIMIT : IN_PROGRESS_BATCHES_LIMIT
      logger.info(`${!batch.status.isInProgress}, ${actorBatchesInProgress.length}, ${limit}, ${actorBatchesInProgress.length >= limit}, ${!actor.role.canOverrideWorkflow}`)
      if (!batch.status.isInProgress && actorBatchesInProgress.length >= limit && !actor.role.canOverrideWorkflow)
          throw new Error(`User ${actorId} is already working: ${actorBatchesInProgress.map(item => item.id)}`);
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 13. Active Batches check passed`)

      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 14. Size override started`)
      if (statusTransition.fromStatus.requiresSizeInput) {
        if (sizeOverride === null || sizeOverride === undefined) throw new Error(`Size was not provided for ${batchId}`);
        if (sizeOverride <= 0) throw new Error(`Size can not be negative for ${batchId}`);
        await this.repository.patch(batchId, { size: sizeOverride });
        batch.size = sizeOverride;
        logger.info(`Batch: ${batchId} | Actor: ${actorId}: 14.1. Size override passed b:${batch.size} s:${sizeOverride}, bid: ${batchId}`)
      }
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 15. Size override passed`)

      const totalDefects = defects.reduce((sum, d) => sum + d.quantity, 0);
      if (batch.size != null && totalDefects > batch.size)
        throw new Error(`Total defects (${totalDefects}) exceed size (${batch.size}) for batch ${batchId}`,);

      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 16. Defects built ${defects}`)

      let update: BatchInsert = { 
        status: { id: statusTransition.toStatus.id }
      }

      if (statusTransition.fromStatus.subtractDefects) {
        update = {
          status: { id: statusTransition.toStatus.id },
          size: Math.max((batch.size || 0) - totalDefects, 0),
        }
      }
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 16. Update Built: ${JSON.stringify(update)}`)

      const updated = await this.repository.patch(batch.id, update)

      batch.size = updated.size
      batch.status.id = updated.status.id
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 17. Updated batch: ${JSON.stringify(updated)}, CTX: ${JSON.stringify(batch)}`)

      const toInsert: BatchTransitionInsert  = {
        batch: { id: batch.id, size: batch.size || 0 },
        fromStatus: { id: statusTransition.fromStatus.id },
        toStatus: { id: statusTransition.toStatus.id },
        actor: { id: actor.id },
        device: { id: shift.device.id },
        coworkers: coworkers.map(c => ({ id: c }))
      }
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 18. Default to insert: ${JSON.stringify(toInsert)}`)

      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 19. Batch.Status.isPackaging: ${batch.status.isPackaging}, reminder: ${remainder}`)
      if (batch.status.isPackaging) {
        const product = await this.productRepository.find({ id: batch.product.id });
        logger.info(`Batch: ${batchId} | Actor: ${actorId}: 19.1. Product: \n\n${JSON.stringify(product)}, \n\nreminder: ${remainder}`)
        if (product && remainder !== null && remainder !== undefined) { // this only happens in batch_status id = 13
          if (remainder === 0) {
            if((batch.size ?? 0) % product.boxSize !== 0){
              throw new Error(`Product sums is not correct %`);
            }
            logger.info(`Batch: ${batchId} | Actor: ${actorId}: 19.1.a. Completed: Product: \n\n${JSON.stringify(product)}, \n\nreminder: ${remainder}`)
            const completedID = 14
            const addSize = batch.size || 0
            logger.info(`Add Size ${addSize}, bs: ${batch.size}: quantity: ${product.quantity + addSize} product.quantity: ${product.quantity}`)
            const updatedProduct = await this.productRepository.patch(batch.product.id, { quantity: product.quantity + addSize})
            await this.repository.patch(batch.id, { size: 0, status: { id: completedID }})
            toInsert.toStatus.id = completedID;
            logger.info("here 2")
            logger.info(`Batch: ${batchId} | Actor: ${actorId}: 19.2.a. Completed: Updated Product: \n\n${JSON.stringify(updatedProduct)},\nToInsert: ${JSON.stringify(toInsert)}`)
            logger.info("here 22")
          } else {
            logger.info(`Batch: ${batchId} | Actor: ${actorId}: 19.1.b. Labeling: Product: \n\n${JSON.stringify(product)}, \n\nreminder: ${remainder}`)
            logger.info(`${batch.size}, ${product.boxSize}, ${remainder}, ${((batch.size ?? 0) % product.boxSize !== remainder)}`)
            if((batch.size ?? 0) % product.boxSize !== remainder){
              throw new Error(`Product sums is not correct %`);
            }
            const labelingID = 12
            const addSize = batch.size || 0
            const updatedProduct = await this.productRepository.patch(batch.product.id, { quantity: product.quantity + addSize - remainder})
            await this.repository.patch(batch.id, { size: remainder, status: { id: labelingID }})
            toInsert.toStatus.id = labelingID;
            toInsert.batch.size -= remainder 
            logger.info(`Batch: ${batchId} | Actor: ${actorId}: 19.2.b. Labeling: \n\nUpdated Product: ${JSON.stringify(updatedProduct)},\nToInsert: ${JSON.stringify(toInsert)}`)
          }
        }
      }

      const newBatchTransition = await this.batchTransitionsRepository.create(toInsert)
      logger.info(`Batch: ${batchId} | Actor: ${actorId}: 20. new batch transition created\nToInsert:${JSON.stringify(toInsert)}\n${JSON.stringify(newBatchTransition)}`)
      if (defects.length > 0) {
        const defectsToInsert: DefectInsert[] = defects.map((defect) => {
          return { transition: { id: newBatchTransition.id }, defectType: { id: defect.defect_type_id }, quantity: defect.quantity}
        })
        this.defectRepository.createMany(defectsToInsert)
      }
      logger.info("advance success")
    });
  }
}
