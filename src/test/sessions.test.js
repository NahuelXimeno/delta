import chai from "chai";
import supertest from "supertest";
import app from "../app";
const expect = chai.expect;
const request = supertest(app);

describe("Pruebas del Enrutador de Sesiones", () => {
  it("debería iniciar sesión exitosamente", async () => {
    const userData = {
      username: "usuario",
      password: "contraseña",
    };

    const response = await request.post("/login").send(userData);
    expect(response.status).to.equal(200);
    expect(response.redirects[0]).to.equal("/profile");
  });

  it("debería registrar un nuevo usuario y redirigir al perfil", async () => {
    const userData = {
      username: "nuevoUsuario",
      email: "nuevo@usuario.com",
      password: "nuevaContraseña",
    };

    const response = await request.post("/signup").send(userData);
    expect(response.status).to.equal(200);
    expect(response.redirects[0]).to.equal("/profile");
  });

  it("debería obtener el usuario actual", async () => {
    const response = await request.get("/current");
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("username");
    expect(response.body).to.have.property("email");
  });
});
