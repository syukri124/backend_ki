const db = require("../models");
const Orders = db.Orders;
const OrderItems = db.OrderItems;
const Users = db.Users;
const Products = db.Products;
const dbChangeLogController = require("./dbChangeLogController");

// CREATE Order
exports.createOrder = async (req, res) => {
    try {
        const user_id = req.user.id;
        const order = await Orders.create(req.body);

        // Catat ke DBChangeLog
        await dbChangeLogController.logChange({
            table_name: "Orders",
            action: "CREATE",
            record_id: order.id,
            user_id,
            description: JSON.stringify(order)
        });

        res.json({ success: true, message: "Order created", data: order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET Orders (tidak dicatat di log karena hanya READ)
exports.getOrders = async (req, res) => {
    try {
        const data = await Orders.findAll({
            include: [
                { model: Users, as: "user", attributes: ["id", "username"] },
                { model: OrderItems, as: "items", include: [{ model: Products, as: "product", attributes: ["name"] }] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
