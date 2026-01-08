import pool from "../../../loaders/db.loader.js";

export const ProjectModel = {

	async create(companyId, data) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// helper to verify an employee exists for this company
			const employeeExists = async (client, companyId, employeeId) => {
				if (!employeeId) return false;
				const { rows } = await client.query('SELECT 1 FROM employees WHERE company_id = $1 AND employee_id = $2 LIMIT 1', [companyId, employeeId]);
				return rows.length > 0;
			};

			// 1. Get and increment the next project number
			const { rows: companyRows } = await client.query(
				`UPDATE companies SET next_project_number = next_project_number + 1 WHERE company_id = $1 RETURNING next_project_number`,
				[companyId]
			);
			const projectNumber = companyRows[0].next_project_number;
			const project_id = `PRJ-${String(projectNumber).padStart(3, '0')}`;

			// 2. Create the main project record (all fields)
			const projectQuery = `
			INSERT INTO projects (
				company_id, project_id, name, type, linked_sales_order_id, customer, manager_id, department, description, status, start_date, due_date, priority_level, production_location, delivery_location, linked_showroom_or_project_site, linked_design_file_template_id, linked_products, bill_of_materials_version, custom_requirements_uploads, role_or_skill_tags, tool_quantity_reservation_window, trigger_material_request, estimated_labor_cost, estimated_overhead, estimated_profit_margin, payment_received_deposit_status, qc_checkpoints, qc_responsible_employee_id, known_risks_warnings, notes_instructions, customer_comments, design_approval_needed, approval_chain, budget, progress
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
			) RETURNING *;
		`;
			// validate manager exists for this company to avoid FK violations
			// Note: Manager is still a user, so we check users table for manager
			const userExists = async (client, companyId, userId) => {
				if (!userId) return false;
				const { rows } = await client.query('SELECT 1 FROM users WHERE company_id = $1 AND user_id = $2 LIMIT 1', [companyId, userId]);
				return rows.length > 0;
			};
			const safeManagerId = (await userExists(client, companyId, data.manager_id)) ? data.manager_id : null;

			const projectValues = [
				companyId, project_id, data.name, data.type || null, data.linked_sales_order_id || null, data.customer || null, safeManagerId, data.department || null, data.description || null, data.status || 'planned',
				data.start_date || null, data.due_date || null, data.priority_level || null, data.production_location || null, data.delivery_location || null, data.linked_showroom_or_project_site || null, data.linked_design_file_template_id || null, data.linked_products || null, data.bill_of_materials_version || null, data.custom_requirements_uploads || null, data.role_or_skill_tags || null, data.tool_quantity_reservation_window || null, data.trigger_material_request || null, data.estimated_labor_cost || null, data.estimated_overhead || null, data.estimated_profit_margin || null, data.payment_received_deposit_status || null, data.qc_checkpoints || null, data.qc_responsible_employee_id || null, data.known_risks_warnings || null, data.notes_instructions || null, data.customer_comments || null, data.design_approval_needed || null, data.approval_chain || null, data.budget || null, data.progress || null
			];
			const { rows: projectRows } = await client.query(projectQuery, projectValues);
			const newProject = projectRows[0];

			// 3. Create the project items/tasks (if any)
			const createdItems = [];
			if (data.items && data.items.length > 0) {
				for (const item of data.items) {
					const itemQuery = `
					INSERT INTO project_items (company_id, project_id, name, description, status, assignee_id, due_date)
					VALUES ($1, $2, $3, $4, $5, $6, $7)
					RETURNING *;
				`;
					const itemValues = [
						companyId, project_id, item.name, item.description || null, item.status || 'pending', item.assignee_id || null, item.due_date || null
					];
					const { rows: itemRows } = await client.query(itemQuery, itemValues);
					createdItems.push(itemRows[0]);
				}
			}
			newProject.items = createdItems;

			// 4. Project team members
			if (data.projectTeamMembers && data.projectTeamMembers.length > 0) {
				for (const member of data.projectTeamMembers) {
					await client.query(
						`INSERT INTO project_team_members (company_id, project_id, employee_id, role_or_skill_tags) VALUES ($1, $2, $3, $4)`,
						[companyId, project_id, member.employeeId, member.roleOrSkillTags || null]
					);
				}
			}

			// 5. Tool assignments
			if (data.toolAssignments && data.toolAssignments.length > 0) {
				for (const tool of data.toolAssignments) {
					for (const assign of (tool.assignments || [])) {
						const safeAssignedId = (await employeeExists(client, companyId, assign.assignedEmployeeId)) ? assign.assignedEmployeeId : null;
						await client.query(
							`INSERT INTO project_tool_assignments (company_id, project_id, tool_type_id, assigned_employee_id, start_date, end_date, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
							[companyId, project_id, tool.toolTypeId, safeAssignedId, assign.startDate || null, assign.endDate || null, assign.startTime || null, assign.endTime || null]
						);
					}
				}
			}

			// 6. Uploaded files
			if (data.uploadedFiles && data.uploadedFiles.length > 0) {
				for (const file of data.uploadedFiles) {
					await client.query(
						`INSERT INTO project_uploaded_files (company_id, project_id, file_name, file_url) VALUES ($1, $2, $3, $4)`,
						[companyId, project_id, file.name, file.url || null]
					);
				}
			}

			await client.query('COMMIT');
			return newProject;
		} catch (error) {
			await client.query('ROLLBACK');
			console.error('Error creating project:', error);
			throw new Error('Could not create project');
		} finally {
			client.release();
		}
	},

	async findAll(companyId) {
		const query = `
		SELECT p.*, up.name as manager_name
		FROM projects p
		LEFT JOIN user_profiles up ON p.company_id = up.company_id AND p.manager_id = up.user_id
		WHERE p.company_id = $1 ORDER BY p.created_at DESC
	`;
		const { rows } = await pool.query(query, [companyId]);
		return rows;
	},

	async findById(companyId, projectId) {
		const query = `
		SELECT p.*, up.name as manager_name
		FROM projects p
		LEFT JOIN user_profiles up ON p.company_id = up.company_id AND p.manager_id = up.user_id
		WHERE p.company_id = $1 AND p.project_id = $2`;
		const { rows: projectRows } = await pool.query(query, [companyId, projectId]);
		if (projectRows.length === 0) {
			return null;
		}
		const project = projectRows[0];

		// Project items/tasks
		const { rows: itemRows } = await pool.query('SELECT * FROM project_items WHERE company_id = $1 AND project_id = $2 ORDER BY id', [companyId, projectId]);
		project.items = itemRows;

		// Team members
		const { rows: teamRows } = await pool.query('SELECT * FROM project_team_members WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);
		project.projectTeamMembers = teamRows;

		// Tool assignments
		const { rows: toolRows } = await pool.query('SELECT * FROM project_tool_assignments WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);
		project.toolAssignments = toolRows;

		// Uploaded files
		const { rows: fileRows } = await pool.query('SELECT * FROM project_uploaded_files WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);
		project.uploadedFiles = fileRows;

		return project;
	},

	async update(companyId, projectId, data) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// Update all main project fields
			const updateQuery = `
			UPDATE projects SET
				name = $3,
				type = $4,
				linked_sales_order_id = $5,
				customer = $6,
				manager_id = $7,
				department = $8,
				description = $9,
				status = $10,
				start_date = $11,
				due_date = $12,
				priority_level = $13,
				production_location = $14,
				delivery_location = $15,
				linked_showroom_or_project_site = $16,
				linked_design_file_template_id = $17,
				linked_products = $18,
				bill_of_materials_version = $19,
				custom_requirements_uploads = $20,
				role_or_skill_tags = $21,
				tool_quantity_reservation_window = $22,
				trigger_material_request = $23,
				estimated_labor_cost = $24,
				estimated_overhead = $25,
				estimated_profit_margin = $26,
				payment_received_deposit_status = $27,
				qc_checkpoints = $28,
				qc_responsible_employee_id = $29,
				known_risks_warnings = $30,
				notes_instructions = $31,
				customer_comments = $32,
				design_approval_needed = $33,
				approval_chain = $34,
				budget = $35,
				progress = $36,
				updated_at = NOW()
			WHERE company_id = $1 AND project_id = $2
			RETURNING *;
		`;
			// validate manager exists for this company to avoid FK violations on update
			const safeUpdateManagerId = (await client.query('SELECT 1 FROM users WHERE company_id = $1 AND user_id = $2 LIMIT 1', [companyId, data.manager_id || null])).rows.length > 0 ? data.manager_id : null;

			const updateValues = [
				companyId, projectId, data.name, data.type || null, data.linked_sales_order_id || null, data.customer || null, safeUpdateManagerId, data.department || null, data.description || null, data.status || 'planned',
				data.start_date || null, data.due_date || null, data.priority_level || null, data.production_location || null, data.delivery_location || null, data.linked_showroom_or_project_site || null, data.linked_design_file_template_id || null, data.linked_products || null, data.bill_of_materials_version || null, data.custom_requirements_uploads || null, data.role_or_skill_tags || null, data.tool_quantity_reservation_window || null, data.trigger_material_request || null, data.estimated_labor_cost || null, data.estimated_overhead || null, data.estimated_profit_margin || null, data.payment_received_deposit_status || null, data.qc_checkpoints || null, data.qc_responsible_employee_id || null, data.known_risks_warnings || null, data.notes_instructions || null, data.customer_comments || null, data.design_approval_needed || null, data.approval_chain || null, data.budget || null, data.progress || null
			];
			const { rows } = await client.query(updateQuery, updateValues);
			if (rows.length === 0) {
				await client.query('ROLLBACK');
				return null;
			}
			const updatedProject = rows[0];

			// Remove and re-insert related arrays (team members, tool assignments, uploaded files, items)
			await client.query('DELETE FROM project_items WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);
			await client.query('DELETE FROM project_team_members WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);
			await client.query('DELETE FROM project_tool_assignments WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);
			await client.query('DELETE FROM project_uploaded_files WHERE company_id = $1 AND project_id = $2', [companyId, projectId]);

			// Items
			if (data.items && data.items.length > 0) {
				for (const item of data.items) {
					const itemQuery = `
					INSERT INTO project_items (company_id, project_id, name, description, status, assignee_id, due_date)
					VALUES ($1, $2, $3, $4, $5, $6, $7)
					RETURNING *;
				`;
					const itemValues = [
						companyId, projectId, item.name, item.description || null, item.status || 'pending', item.assignee_id || null, item.due_date || null
					];
					await client.query(itemQuery, itemValues);
				}
			}

			// Team members
			if (data.projectTeamMembers && data.projectTeamMembers.length > 0) {
				for (const member of data.projectTeamMembers) {
					await client.query(
						`INSERT INTO project_team_members (company_id, project_id, employee_id, role_or_skill_tags) VALUES ($1, $2, $3, $4)`,
						[companyId, projectId, member.employeeId, member.roleOrSkillTags || null]
					);
				}
			}

			// Tool assignments
			if (data.toolAssignments && data.toolAssignments.length > 0) {
				for (const tool of data.toolAssignments) {
					for (const assign of (tool.assignments || [])) {
						await client.query(
							`INSERT INTO project_tool_assignments (company_id, project_id, tool_type_id, assigned_employee_id, start_date, end_date, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
							[companyId, projectId, tool.toolTypeId, assign.assignedEmployeeId || null, assign.startDate || null, assign.endDate || null, assign.startTime || null, assign.endTime || null]
						);
					}
				}
			}

			// Uploaded files
			if (data.uploadedFiles && data.uploadedFiles.length > 0) {
				for (const file of data.uploadedFiles) {
					await client.query(
						`INSERT INTO project_uploaded_files (company_id, project_id, file_name, file_url) VALUES ($1, $2, $3, $4)`,
						[companyId, projectId, file.name, file.url || null]
					);
				}
			}

			await client.query('COMMIT');
			return updatedProject;
		} catch (error) {
			await client.query('ROLLBACK');
			console.error('Error updating project:', error);
			throw new Error('Could not update project');
		} finally {
			client.release();
		}
	},

	async remove(companyId, projectId) {
		const { rowCount } = await pool.query(
			'DELETE FROM projects WHERE company_id = $1 AND project_id = $2',
			[companyId, projectId]
		);
		return rowCount > 0;
	},

	async getInfo(companyId) {
		// 1. Employees
		const { rows: employees } = await pool.query(
			`SELECT * FROM employees WHERE company_id = $1 ORDER BY created_at DESC`,
			[companyId]
		);

		// 2. Locations
		const { rows: locations } = await pool.query(
			`SELECT * FROM locations WHERE company_id = $1 ORDER BY created_at DESC`,
			[companyId]
		);

		// 3. Orders and their items
		const ordersQuery = `
			SELECT o.*, l.name as customer_name
			FROM orders o
			LEFT JOIN leads l ON o.company_id = l.company_id AND o.lead_id = l.lead_id
			WHERE o.company_id = $1 ORDER BY o.created_at DESC
		`;
		const { rows: orders } = await pool.query(ordersQuery, [companyId]);

		const { rows: itemRows } = await pool.query(
			'SELECT * FROM order_items WHERE company_id = $1 ORDER BY id',
			[companyId]
		);

		const itemsByOrder = itemRows.reduce((acc, item) => {
			if (!acc[item.order_id]) acc[item.order_id] = [];
			acc[item.order_id].push(item);
			return acc;
		}, {});

		const ordersWithItems = orders.map(order => ({
			...order,
			items: itemsByOrder[order.order_id] || []
		}));


		console.log("employees= ",employees,"locations= ",locations,"ordersWithItems= ",ordersWithItems);
		
		return [employees, locations, ordersWithItems];
	}
};
