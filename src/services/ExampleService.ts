import { supabase } from '../config/supabase';
import { generateSlug } from '../utils/stringUtils';

interface Example {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

export class ExampleService {
    /**
     * Creates a new example
     * 
     * @param data Example data
     * @returns The created example or error
     */
    async createExample(data: Partial<Example>): Promise<{ data: Example | null; error: any }> {
        try {
            // Generate slug from name
            const slug = generateSlug(data.name || '');

            const { data: example, error } = await supabase
                .from('examples')
                .insert([
                    {
                        ...data,
                        slug,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return { data: example, error: null };
        } catch (error: any) {
            console.error('Error creating example:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Updates an existing example
     * 
     * @param id Example ID
     * @param data Updated example data
     * @returns The updated example or error
     */
    async updateExample(id: string, data: Partial<Example>): Promise<{ data: Example | null; error: any }> {
        try {
            const updateData: any = { ...data, updated_at: new Date().toISOString() };

            // Generate new slug if name changed
            if (data.name) {
                updateData.slug = generateSlug(data.name);
            }

            const { data: example, error } = await supabase
                .from('examples')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { data: example, error: null };
        } catch (error: any) {
            console.error('Error updating example:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Deletes an example
     * 
     * @param id Example ID
     * @returns Success status or error
     */
    async deleteExample(id: string): Promise<{ success: boolean; error: any }> {
        try {
            const { error } = await supabase
                .from('examples')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error deleting example:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Finds an example by ID
     * 
     * @param id Example ID
     * @returns The example or null if not found
     */
    async findExampleById(id: string): Promise<{ data: Example | null; error: any }> {
        try {
            const { data: example, error } = await supabase
                .from('examples')
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { data: example, error: null };
        } catch (error: any) {
            console.error('Error finding example:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Finds an example by slug
     * 
     * @param slug Example slug
     * @returns The example or null if not found
     */
    async findExampleBySlug(slug: string): Promise<{ data: Example | null; error: any }> {
        try {
            const { data: example, error } = await supabase
                .from('examples')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { data: example, error: null };
        } catch (error: any) {
            console.error('Error finding example by slug:', error);
            return { data: null, error: error.message };
        }
    }

    /**
     * Lists examples with pagination
     * 
     * @param page Page number
     * @param limit Items per page
     * @param isActiveOnly Filter for active examples only
     * @returns List of examples and total count
     */
    async listExamples(page: number = 1, limit: number = 10, isActiveOnly: boolean = false): Promise<{ data: Example[]; count: number; error: any }> {
        try {
            const offset = (page - 1) * limit;

            let query = supabase
                .from('examples')
                .select('*', { count: 'exact' });

            if (isActiveOnly) {
                query = query.eq('is_active', true);
            }

            const { data: examples, count, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: examples as Example[],
                count: count || 0,
                error: null
            };
        } catch (error: any) {
            console.error('Error listing examples:', error);
            return { data: [], count: 0, error: error.message };
        }
    }
} 