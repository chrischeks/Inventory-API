import { NextFunction, Request, Response, Router } from "express";
import { BaseController } from "./basecontroller";
import { InventoryCategoryService } from "../services/category";
import { InventoryService } from "../services/inventoryservice";
import { InventoryRequisitionService } from "../services/requisitionservice";
import { AdminService } from "../services/adminservice";
import { AuditTrailService } from "../services/audittrailservice";

export class InventoryController extends BaseController {
  public loadRoutes(prefix: String, router: Router) {
    this.listAuditTrail(prefix, router);
    this.createInventoryCategory(prefix, router);
    this.listInventoryCategories(prefix, router);
    this.listCategoryPropertyTypes(prefix, router);
    this.updateInventoryCategory(prefix, router);
    this.suspendInventoryCategory(prefix, router);
    this.unsuspendInventoryCategory(prefix, router);
    this.updateSettings(prefix, router);
    this.listSettings(prefix, router);
    this.addInventoryItem(prefix, router);
    this.listInventoryItem(prefix, router);
    this.updateInventoryItem(prefix, router);
    this.approveInventoryItem(prefix, router);
    this.declineInventoryItem(prefix, router);
    this.fetchCategoryById(prefix, router);
    this.fetchItemById(prefix, router);
    this.querySearchEngine(prefix, router);
    this.createInventoryRequisition(prefix, router);
    this.listInventoryRequisition(prefix, router);
    this.fetchRequisitionById(prefix, router);
    this.approveInventoryItemRequisition(prefix, router);
    this.declineInventoryItemRequisition(prefix, router);
    this.inventoryStoreAccessSearch(prefix, router);
    this.moveRequisition(prefix, router);
    this.restock(prefix, router);
  }

  public listAuditTrail(prefix: String, router: Router): any {
    router.get(
      prefix + "/audit_trail",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new AuditTrailService().listTrail(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public querySearchEngine(prefix: String, router: Router): any {
    router.get(
      prefix + "/items/search",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().querySearchEngine(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public createInventoryCategory(prefix: String, router: Router): any {
    router.post(
      prefix + "/category",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().createInventoryCategory(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public listInventoryCategories(prefix: String, router: Router): any {
    router.get(
      prefix + "/category",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().listInventoryCategories(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public listCategoryPropertyTypes(prefix: String, router: Router): any {
    router.get(
      prefix + "/category/property_types",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().listCategoryPropertyTypes(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public updateInventoryCategory(prefix: String, router: Router): any {
    router.put(
      prefix + "/category/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().updateInventoryCategory(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }
  public suspendInventoryCategory(prefix: String, router: Router): any {
    router.patch(
      prefix + "/category/suspend/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().suspendInventoryCategory(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public unsuspendInventoryCategory(prefix: String, router: Router): any {
    router.patch(
      prefix + "/category/unsuspend/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().unsuspendInventoryCategory(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public fetchCategoryById(prefix: String, router: Router): any {
    router.get(
      prefix + "/category/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryCategoryService().fetchCategoryById(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public updateSettings(prefix: String, router: Router): any {
    router.put(
      prefix + "/settings",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new AdminService().createSettings(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public listSettings(prefix: String, router: Router): any {
    router.get(
      prefix + "/settings",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new AdminService().listSettings(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public addInventoryItem(prefix: String, router: Router): any {
    router.post(
      prefix + "/item",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().addInventoryItem(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public listInventoryItem(prefix: String, router: Router): any {
    router.get(
      prefix + "/item",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().listInventoryItem(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public fetchItemById(prefix: String, router: Router): any {
    router.get(
      prefix + "/item/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().fetchItemById(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public updateInventoryItem(prefix: String, router: Router): any {
    router.put(
      prefix + "/item/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().updateInventoryItem(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public approveInventoryItem(prefix: String, router: Router): any {
    router.patch(
      prefix + "/item/approve/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().approveInventoryItem(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public declineInventoryItem(prefix: String, router: Router): any {
    router.patch(
      prefix + "/item/decline/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().declineInventoryItem(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public restock(prefix: String, router: Router): any {
    router.patch(
      prefix + "/item/restock/:itemId",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryService().processRestockItem(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }


  public createInventoryRequisition(prefix: String, router: Router): any {
    router.post(
      prefix + "/requisition",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().createInventoryRequisition(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public listInventoryRequisition(prefix: String, router: Router): any {
    router.get(
      prefix + "/requisition",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().listInventoryRequisition(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public fetchRequisitionById(prefix: String, router: Router): any {
    router.get(
      prefix + "/requisition/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().fetchRequisitionById(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      }
    );
  }

  public approveInventoryItemRequisition(prefix: String, router: Router): any {
    router.put(
      prefix + "/requisition/approve/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().approveInventoryItemRequisition(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }

  public declineInventoryItemRequisition(prefix: String, router: Router): any {
    router.put(
      prefix + "/requisition/decline/:id",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().declineInventoryItemRequisition(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }


  public moveRequisition(prefix: String, router: Router): any {
    router.patch(
      prefix + "/requisition/move/:acceptanceCode",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().processMoveRequisition(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }


  public inventoryStoreAccessSearch(prefix: String, router: Router): any {
    router.get(
      prefix + "/store/access",
      [this.authorize.bind(this)],
      (req: Request, res: Response, next: NextFunction) => {
        new InventoryRequisitionService().inventoryStoreAccessSearch(
          req,
          res,
          next,
          this.user_id,
          this.user_tenantId
        );
      });
  }


  public authorize(req: Request, res: Response, next: NextFunction) {
    if (!this.authorized(req, res, next)) {
      this.sendError(req, res, next, this.notAuthorized);
    } else {
      next();
    }
  }

  constructor() {
    super();
  }
}
