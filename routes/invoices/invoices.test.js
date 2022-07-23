process.env.NODE_ENV = "test";
const request = require("supertest")
const app = require("../../app");
const db = require("../../db");

beforeEach(async function () {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    await db.query("SELECT setval('invoices_id_seq', 1, false)");

    await db.query(`INSERT INTO companies (code, name, description)
                      VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
                             ('ibm', 'IBM', 'Big blue.')`);
    await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
                                   VALUES ('apple', 100, false, '2022-07-23T06:00:00.000Z', null),
                                          ('apple', 200, false, '2022-07-23T06:00:00.000Z', null), 
                                          ('ibm', 300, true, '2022-07-23T06:00:00.000Z', '2018-01-01T06:00:00.000Z')
                                   RETURNING id, comp_code, amt, paid, add_date, paid_date`);
})

afterAll(async function () {
    //close db connection
    await db.end();
})

describe("GET /invoices", () => {
    test("Get all invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "invoices": [
                {
                    "id": 1,
                    "comp_code": "apple",
                    "amt": 100,
                    "paid": false,
                    "add_date": "2022-07-23T06:00:00.000Z",
                    "paid_date": null
                },
                {
                    "id": 2,
                    "comp_code": "apple",
                    "amt": 200,
                    "paid": false,
                    "add_date": "2022-07-23T06:00:00.000Z",
                    "paid_date": null
                },
                {
                    "id": 3,
                    "comp_code": "ibm",
                    "amt": 300,
                    "paid": true,
                    "add_date": "2022-07-23T06:00:00.000Z",
                    "paid_date": "2018-01-01T06:00:00.000Z"
                }
            ]
        })
    })
})

describe("GET /invoices/:name", () => {
    test("Get single invoice by id", async () => {
        const res = await request(app).get(`/invoices/1`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "invoice": {
                "id": 1,
                "comp_code": "apple",
                "amt": 100,
                "paid": false,
                "add_date": "2022-07-23T06:00:00.000Z",
                "paid_date": null
            }
        })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).get(`/invoices/99999999`)
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /invoices", () => {
    test("Creating an invoice", async () => {
        const invoice = { "comp_code": "ibm", "amt": "500" };
        const res = await request(app).post("/invoices").send(invoice)
        expect(res.body).toEqual({
            "invoice": {
                "id": 4,
                "comp_code": "ibm",
                "amt": 500,
                "paid": false,
                "add_date": "2022-07-23T06:00:00.000Z",
                "paid_date": null
            }
        })
        expect(res.statusCode).toBe(201);
    })
})

describe("PUT /invoices/:name", () => {
    test("Updates a single invoice", async () => {
        const res = await request(app).put(`/invoices/1`).send({ "comp_code": "apple", "amt": "500" })
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "invoice": {
                "id": 1,
                "comp_code": "apple",
                "amt": 500,
                "paid": false,
                "add_date": "2022-07-23T06:00:00.000Z",
                "paid_date": null
            }
        })
    })

    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).put(`/invoices/99999999`).send({ name: "ASDFASFD" });
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /invoices/:name", () => {
    test("deletes a single invoice", async () => {
        const res = await request(app).delete(`/invoices/1`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "DELETED!" })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).delete(`/invoices/99999999`);
        expect(res.statusCode).toBe(404);
    })
})