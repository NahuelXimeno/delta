import chai from "chai";
import supertest from "supertest";
import app from "../app";
const expect = chai.expect;
const request = supertest(app);

describe("Pruebas del Enrutador de Carritos", () => {
  it("debería crear un nuevo carrito", async () => {
    const response = await request.post("/api/carts");
    expect(response.status).to.equal(201);
    expect(response.body).to.have.property("_id");
  });

  it("debería obtener una lista de carritos", async () => {
    const response = await request.get("/api/carts");
    expect(response.status).to.equal(200);
    expect(response.body).to.be.an("array");
  });

  it("debería obtener detalles de un carrito por ID", async () => {
    // Agrega un ID de carrito que exista en tu base de datos
    const cartId = "tu-id-de-carrito-existente";
    const response = await request.get(`/api/carts/${cartId}`);
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("_id", cartId);
  });
});
