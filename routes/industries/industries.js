const express = require("express");
const router = new express.Router()
const ExpressError = require("../../expressError")
const db = require("../../db");

router.get("/", async function (req, res, next) {
    //gets all industries
    try {
        const results = await db.query(
            `SELECT * FROM industries`);
        return res.json({ industries: results.rows })
    } catch (err) {
        return next(err)
    }
})

router.post("/", async function (req, res, next) {
    //adds an industry
    try {
        const { code, industry } = req.body;
        const results = await db.query('INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't match any industries with code ${comp_code} for invoice`, 404)
        }
        return res.status(201).json({ industry: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.put("/:code", async function (req, res, next) {
    //associates an industry to a company
    try {
        const { company_code } = req.body;
        const industry_code = code
        const results = await db.query('INSERT INTO company_industries (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code', [company_code, industry_code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Something went wrong.`, 404)
        }
        return res.status(201).json({ industry: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

module.exports = router;