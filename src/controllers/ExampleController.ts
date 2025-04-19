import { Request, Response } from 'express';
import { ExampleService } from '../services/ExampleService';

export class ExampleController {
    private exampleService: ExampleService;

    constructor() {
        this.exampleService = new ExampleService();
    }

    /**
     * Get a list of examples with pagination
     */
    listExamples = async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const isActiveOnly = req.query.active === 'true';

            const { data, count, error } = await this.exampleService.listExamples(
                page,
                limit,
                isActiveOnly
            );

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(200).json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error: any) {
            console.error('Error in listExamples controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get example by ID
     */
    getExampleById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { data, error } = await this.exampleService.findExampleById(id);

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            if (!data) {
                res.status(404).json({
                    success: false,
                    message: 'Example not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in getExampleById controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Create a new example
     */
    createExample = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, isActive } = req.body;

            // Validate required fields
            if (!name) {
                res.status(400).json({
                    success: false,
                    message: 'Name is required'
                });
                return;
            }

            // Create example
            const { data, error } = await this.exampleService.createExample({
                name,
                description,
                is_active: isActive !== undefined ? isActive : true
            });

            if (error) {
                res.status(400).json({ success: false, message: error });
                return;
            }

            res.status(201).json({
                success: true,
                data
            });
        } catch (error: any) {
            console.error('Error in createExample controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
} 