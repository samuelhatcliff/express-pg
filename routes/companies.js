const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();
const db = require("../db");

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
        const results = await db.query(
            `SELECT * FROM companies WHERE code = $1`, [code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        return res.send({ company: results.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.post('/', async (req, res, next) => {
    //adds a company
    try {
        const { code, name, description } = req.body;
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
        if (results.rows.length !== undefined) return res.send({ status: "DELETED!" })
        throw new ExpressError(`Can't find company with code of ${code}`, 404)
    } catch (err) {
        return next(err)
    }
})





module.exports = router;