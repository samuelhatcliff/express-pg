const express = require("express");
const router = new express.Router()
const ExpressError = require("../../expressError")
const db = require("../../db");
const slugify = require('slugify')


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
        } else {
            return res.send({ invoice: results.rows[0] })
        }
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
        let { amt, paid } = req.body;
        const { id } = req.params;
        const invoice = await db.query(
            `SELECT * FROM invoices WHERE id = $1`, [id]);
        let paid_date = invoice['paid_date']
        let hasPaid = invoice['paid']
        if (paid && !hasPaid) {
            paid_date = new Date()
        } else if (!paid && hasPaid) {
            paid_date = null
        }
        const results = await db.query(
            'UPDATE invoices SET paid=$1, amt=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date', [paid, amt, paid_date, id]);
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
        const resultsBefore = await db.query(
            `SELECT * FROM invoices WHERE id = $1`, [id]);
        const resultsAfter = await db.query('DELETE FROM invoices WHERE id = $1', [id])
        if (resultsBefore.rows.length === resultsAfter.rows.length) {
            throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        }
        return res.send({ status: "DELETED!" })
    } catch (err) {
        return next(err)
    }
})

module.exports = router;