import chai from "chai";
import supertest from "supertest";
import app from "../app";
const expect = chai.expect;
const request = supertest(app);

describe("Pruebas del Enrutador de Productos", () => {
  it("debería obtener una lista de productos", async () => {
    const response = await request.get("/api/products");
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("status", "success");
    expect(response.body).to.have.property("payload").to.be.an("array");
  });

  it("debería crear un nuevo producto", async () => {
    const datosProducto = {
      title: "Nuevo Producto",
      description: "Un nuevo producto para pruebas",
      price: 10.99,
      thumbnail: "https://ejemplo.com/imagen.jpg",
      code: "P123",
      stock: 50,
      category: "Electrónicos",
      status: "activo",
    };

    const response = await request
      .post("/api/products")
      .send(datosProducto)
      .set("Authorization", "Bearer tuTokenDeAcceso");

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property(
      "message",
      "Producto creado exitosamente."
    );
  });

  it("debería obtener detalles de un producto por ID", async () => {
    // Agrega un ID de producto que exista en tu base de datos
    const productId = "tu-id-de-producto-existente";
    const response = await request.get(`/api/products/${productId}`);
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("title");
    expect(response.body).to.have.property("price");
  });
});
