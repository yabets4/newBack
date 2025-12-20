import { Router } from 'express';
import RawMaterial from "./raw material/rawMaterial.route.js";
import RawMaterialMovement from "./rawMaterialMovement/rawMaterialMovement.route.js";
import Asset from "./fixedAsset/assets.routes.js";
import Suppliers from './suppliers/suppliers.route.js';
import ToolsRoutes from './tools/tools.routes.js';
import auth from '../../middleware/auth.middleware.js';
import { authenticateJWT } from '../../middleware/jwt.middleware.js';
import { requestCounter } from '../../middleware/requestCounter.middleware.js';
import { CheckCompanyStatus } from '../../middleware/checkTierLimit.middleware.js';
import Maintenance from './maintenance/maintenance.route.js';
import permission from '../../middleware/permission.middleware.js';
import Catagories from './Categories/main.route.js';
import FinishedProduct from './Finished Product/finishedProduct.route.js';



const r = Router();
r.use(auth(false), authenticateJWT, CheckCompanyStatus, requestCounter);

//------ Raw-Material -------
r.use('/raw-materials', RawMaterial);
r.use('/raw-material-movements', RawMaterialMovement);
//------ Fixed-Assets -------
r.use('/fixed-assets', Asset);
//------ Suppliers -------
r.use('/suppliers', Suppliers);
//------ Tools & Machinery -------
r.use('/tools-machinery', ToolsRoutes);
r.use("/categories", Catagories);

r.use('/maintenance', Maintenance);
r.use('/finished-products', FinishedProduct);


export default r;