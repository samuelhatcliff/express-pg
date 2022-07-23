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
                                   VALUES ('apple', 100, false, '2018-01-01', null),
                                          ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                                          ('ibm', 300, false, '2018-03-01', null)
                                   RETURNING id`);
})

afterAll(async function () {
    //close db connection
    await db.end();
})

describe("GET /companies", () => {
    test("Get all companies", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "companies": [
                {
                    "code": "apple",
                    "name": "Apple Computer",
                    "description": "Maker of OSX."
                },
                {
                    "code": "ibm",
                    "name": "IBM",
                    "description": "Big blue."
                }
            ]
        })
    })
})

describe("GET /companies/:name", () => {
    test("Get single company by name", async () => {
        const res = await request(app).get(`/companies/ibm`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "company": {
                "code": "ibm",
                "name": "IBM",
                "description": "Big blue.",
                "invoices": [
                    3
                ]
            }
        })
    })
    test("Responds with 404 for invalid name", async () => {
        const res = await request(app).get(`/companies/~!@#$%^&`)
        expect(res.statusCode).toBe(404);
    })
})

describe("POST /companies", () => {
    test("Creating an company", async () => {
        const netflix = { "code": "net", "name": "netflix", "description": "Streaming platform" };
        const res = await request(app).post("/companies").send(netflix)
        expect(res.body).toEqual({
            "company": {
                "code": "net",
                "name": "netflix",
                "description": "Streaming platform"
            }
        })
        expect(res.statusCode).toBe(201);
    })
})

describe("PUT /companies/:name", () => {
    test("Updates a single company", async () => {
        const res = await request(app).put(`/companies/apple`).send({ "name": "Apple Computer", "description": "Founded by Steve Jobs" })
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "company": {
                "name": "Apple Computer",
                "description": "Founded by Steve Jobs",
                "code": "apple"
            }
        })
    })

    test("Responds with 404 for invalid name", async () => {
        const res = await request(app).put(`/companies/~!@#$%^`).send({ name: "ASDFASFD" });
        expect(res.statusCode).toBe(404);
    })
})

describe("DELETE /companies/:name", () => {
    test("deletes a single company", async () => {
        const res = await request(app).delete(`/companies/apple`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: "DELETED!" })
    })
    test("Responds with 404 for invalid name", async () => {
        const res = await request(app).delete(`/companies/~!@#$`);
        expect(res.statusCode).toBe(404);
    })
})