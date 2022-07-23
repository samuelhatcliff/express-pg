const express = require("express");
const ExpressError = require("../../expressError")
const router = new express.Router();
const db = require("../../db");
const slugify = require('slugify')

router.get("/", async function (req, res, next) {
    //get all companies
    try {
        const results = await db.query(
            `SELECT * FROM companies`);
        return res.json({ companies: results.rows })
    } catch (err) {
        return next(err)
    }
})

router.get("/:code", async function (req, res, next) {
    //get company by code
    try {
        const { code } = req.params
        const company = await db.query(
            `SELECT * FROM companies WHERE code = $1`, [code]);
        if (company.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code = $1`, [code])
        const invoiceIds = invoices.rows.map(invoice => invoice.id)
        const industries = await db.query(`SELECT * FROM company_industries WHERE company_code = $1`, [code])
        const industryCodes = industries.rows.map(industry => industry.industry_code)
        const { name, description } = company.rows[0]
        const resObj = { company: { code, name, description, "invoices": invoiceIds, "industries": industryCodes } }
        return res.send(resObj)
    } catch (err) {
        return next(err)
    }
})

router.post('/', async (req, res, next) => {
    //adds a company
    try {
        const { name, description } = req.body;
        const code = slugify(name, { lower: true, strict: true });
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

router.put('/:code', async (req, res, next) => {
    //edits existing company
    try {
        const { code } = req.params
        const { name, description } = req.body
        const results = await db.query(
            'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING name, description, code', [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        return res.send({ company: results.rows[0] })

    } catch (err) {
        return next(err)
    }
})

router.delete("/:code", async function (req, res, next) {
    //deletes a company by code
    try {
        const { code } = req.params
        const results = await db.query('DELETE FROM companies WHERE code = $1', [code])
        if (results.rowCount === 1) return res.send({ status: "DELETED!" })
        throw new ExpressError(`Can't find company with code of ${code}`, 404)
    } catch (err) {
        return next(err)
    }
})





module.exports = router;