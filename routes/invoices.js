const express = require("express");
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db");

router.get("/", async function (req, res, next) {
    //gets all invoices
    try {
        const results = await db.query(
            `SELECT * FROM invoices`);
        return res.json({ invoices: results.rows })
    } catch (err) {
        return next(err)
    }
})

router.get("/:id", async function (req, res, next) {
    //get invoice by id
    try {
        const { id } = req.params
        const results = await db.query(
            `SELECT * FROM invoices WHERE id = $1`, [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find any invoice with id of ${id}`, 404)
        }
        return res.send({ invoice: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.post('/', async (req, res, next) => {
    //adds an invoice
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't match any companies with code ${comp_code} for invoice`, 404)
        }
        return res.status(201).json({ invoice: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.put('/:id', async (req, res, next) => {
    //edits existing invoice
    try {
        const { amt } = req.body
        const { id } = req.params
        const results = await db.query(
            'UPDATE invoices SET amt=$1 WHERE id=2$ RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        }
        return res.send({ invoice: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.delete("/:id", async function (req, res, next) {
    //deletes an invoice by id
    try {
        const { id } = req.params
        const results = await db.query('DELETE FROM invoices WHERE id = $1', [id])
        if (results.rows.length !== undefined) return res.send({ status: "DELETED!" })
        throw new ExpressError(`Can't find company with code of ${code}`, 404)
    } catch (err) {
        return next(err)
    }
})

module.exports = router;