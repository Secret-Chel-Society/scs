import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

type SchemaType<T> = z.ZodSchema<T>;

export function validateRequest<T>(
  schema: SchemaType<T>,
  getData: (req: Request) => unknown
) {
  return async (req: Request) => {
    try {
      const data = await getData(req);
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation failed',
            errors: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

export async function validateQuery<T>(
  req: Request,
  schema: SchemaType<T>
): Promise<T | NextResponse> {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  
  try {
    return await schema.parseAsync(query);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid query parameters',
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    throw error;
  }
}

export async function validateBody<T>(
  req: Request,
  schema: SchemaType<T>
): Promise<T | NextResponse> {
  try {
    const body = await req.json();
    return await schema.parseAsync(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request body',
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    throw error;
  }
}
