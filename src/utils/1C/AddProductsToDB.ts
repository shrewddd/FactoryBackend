import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { type ExternalProduct, ProductsFromExternalSchema } from 'schemas/external/products';
import { query } from 'db';

export function readProductsFromExcel(): ExternalProduct[] {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const excelFilePath = path.join(__dirname, '../../data/products.xlsx');
    
    const workbook = XLSX.readFile(excelFilePath);
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) { 
      throw new Error('No sheets found in the Excel file'); 
    }
    
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) { 
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    const data: ExternalProduct[] = XLSX.utils.sheet_to_json(worksheet, { 
      header: ['code', 'empty', 'name'],
      defval: null 
    });
    
    const cleanedData = data.map(({ code, name }) => ({ code, name }));
    
    return cleanedData;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

export const AddProductsToDB = async (): Promise<ExternalProduct[]> => {
  const products = readProductsFromExcel();
  
  let parsedProducts: ExternalProduct[];
  try {
    parsedProducts = ProductsFromExternalSchema.parse(products);
  } catch (error) {
    console.error(error)
    throw error;
  }

  const seen = new Set<string>();
  const uniqueProducts = parsedProducts.filter((p) => {
    if (!p.code) return false;
    if (seen.has(p.code)) return false;
    seen.add(p.code);
    return true;
  });
  
  const columns = [
    "code",
    "category",
    "name",
    "is_active",
    "measure_unit",
  ];
  
  const values: any[] = [];
  const placeholders = uniqueProducts.map((p: ExternalProduct, i: number) => {
    const offset = i * columns.length;
    values.push(p.code, null, p.name, false, null);
    return `(${columns
      .map((_, j) => `$${offset + j + 1}`)
      .join(",")})`;
  });
  
  const sql = `
    INSERT INTO products (${columns.join(",")})
    VALUES ${placeholders.join(",")}
    RETURNING *
  `;
  
  const result = await query(sql, values);
  
  return result.rows;
};
