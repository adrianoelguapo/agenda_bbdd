// Importar el driver de mysql
var mysql = require('mysql');

// Importar el modulo de readlineSync
const readlineSync = require('readline-sync');

// Guardar en variable la creacion de la conexion
var conexion = mysql.createConnection({
  host: "localhost",
  user: "root"
});

// Funcion para desestablecer la conexion
function desconectar() {
  conexion.end(function (err) {
    if (err) throw err;
    console.log("\nConexion cerrada");
  });
};

// Funcion para la creacion del login
function login() {
  let nombreUsuario = readlineSync.question("Ingrese su nombre de usuario: ");

  // Consultar la base de datos para verificar el nombre de usuario
  conexion.query("SELECT * FROM usuarios WHERE nombre_usuario = ?", [nombreUsuario], (err, registros) => {
    if (err) throw err;

    // Si no se encuentra el usuario
    if (registros.length === 0) {
      console.log("Nombre de usuario inexistente");
      return login();
    }

    let usuario = registros[0]; // Solo deberia haber un registro

    // Pedir la contraseña del usuario, ocultando la entrada
    let contrasenaUsuario = readlineSync.question("\nIngrese su contrasena: ", {
      hideEchoBack: true
    });

    // Verificar la contraseña
    if (usuario.contrasena_usuario == contrasenaUsuario) {
      if (usuario.nombre_usuario == "administrador") {
        console.clear();
        menuAdmin(); // Mostrar menú de administrador
      } else {
        console.clear();
        menuUsuario(usuario.id_usuario); // Mostrar menú de usuario
      }
    } else {
      console.log("Contrasena incorrecta");
      login();
    }
  });
}

// Funcion para el menu del Administrador
function menuAdmin() {
  // Mostrar opciones
  console.log("--- Menu del Administrador ---");
  console.log("1. Operar sobre la agenda de un cliente");
  console.log("2. Crear usuario");
  console.log("3. Eliminar usuario");
  console.log("4. Mostrar usuarios");
  console.log("5. Cerrar sesion");

  // Pedir opcion
  let opcion = readlineSync.question("\nBienvenido Administrador, que accion va a realizar? ");

  // Ejecutar la opción seleccionada
  switch (opcion) {
    case "1":
      modificarAgenda();
      break;
    case "2":
      crearUsuario();
      break;
    case "3":
      eliminarUsuario();
      break;
    case "4":
      listarUsuariosAdmin();
      break;
    case "5":
      console.log("\nHas salido del programa");
      desconectar();
      break;
    default:
      console.clear();
      console.log("Opción no válida\n");
      menuAdmin();
  }
}

// Función para modificar la agenda de un usuario
function modificarAgenda() {
  console.clear();

  // Mostrar la lista de usuarios que no sean el administrador
  conexion.query("SELECT * FROM usuarios WHERE nombre_usuario != 'administrador'", (err, registros) => {
    if (err) throw err;

    if (registros.length === 0) {
      console.log("No hay usuarios para modificar");
      menuAdmin();
    } else {
      console.log("Usuarios:");
      for (let i = 0; i < registros.length; i++) {
        let usuario = registros[i];
        console.log(`${i + 1}. ${usuario.nombre_usuario} ${usuario.apellidos_usuario} - ID: ${usuario.id_usuario}`);
      }

      // Solicitar el nombre del usuario cuya agenda desea modificar
      let idUsuario = readlineSync.question("\nIngrese el ID del usuario cuya agenda desea modificar: ");

      conexion.query("SELECT * FROM usuarios WHERE id_usuario = ?", [idUsuario], (err, registros) => {
        if (err) throw err;

        if (registros.length === 0) {
          return modificarAgenda();
        }

        let usuario = registros[0]; // Solo deberia haber un registro

        console.log("\n-----------------------------------------------------------");
        console.log(`\nModificando la agenda del siguiente usuario:\n\nNombre: ${usuario.nombre_usuario} \n\nApellidos: ${usuario.apellidos_usuario} \n\nID: ${usuario.id_usuario}`);
        let confirmacion = readlineSync.question("\nEstas seguro? [s/n] ");

        if (confirmacion.toLowerCase() === "s") {
          console.clear();
          menuUsuario(usuario.id_usuario); // Usar el mismo menu que para el usuario, pasando el ID del usuario
        } else if (confirmacion.toLowerCase() === "n") {
          console.clear();
          console.log("Se ha cancelado la modificacion de la agenda\n");
          menuAdmin();
        } else {
          modificarAgenda();
        }
      });
    }
  });
}

// Funcion para crear un usuario
function crearUsuario() {
  console.clear();
  let nombreUsuario = readlineSync.question("Ingrese el nombre del nuevo usuario: ");
  let apellidosUsuario = readlineSync.question("\nIngrese los apellidos del nuevo usuario: ");
  let contrasenaUsuario = readlineSync.question("\nIngrese la contrasena del nuevo usuario: ", {
    hideEchoBack: true // Para ocultar la contrasena mientras se escribe
  });

  console.log("\n-----------------------------------------------------------");
  console.log("\nSe creará el siguiente usuario con los siguientes datos: \n\nNombre del Usuario: " + nombreUsuario + "\n\nApellidos del Usuario: " + apellidosUsuario + "\n\nContrasena del Usuario: " + contrasenaUsuario);
  let confirmacion = readlineSync.question("\nEstas seguro? [s/n] ");

  if (confirmacion.toLowerCase() === "s") {

    // Obtener el máximo id_usuario existente
    conexion.query("SELECT MAX(id_usuario) AS count FROM usuarios", (err, resultado) => {
      if (err) throw err;

      let maxIdUsuario = resultado[0].count || 0;
      let nuevoIdUsuario = maxIdUsuario + 1;

      // Inserción en la tabla agendas
      conexion.query("INSERT INTO agendas (id_agenda) VALUES (?)", [nuevoIdUsuario], (err, resultado) => {
        if (err) throw err;

        // Inserción en la tabla usuarios
        conexion.query("INSERT INTO usuarios (id_usuario, nombre_usuario, apellidos_usuario, contrasena_usuario, id_agenda) VALUES (?, ?, ?, ?, ?)", 
        [nuevoIdUsuario, nombreUsuario, apellidosUsuario, contrasenaUsuario, nuevoIdUsuario], (err, resultado) => {
          if (err) throw err;

          console.clear();
          console.log("Usuario creado correctamente\n");
          menuAdmin();
        });
      });
    });
  } else if (confirmacion.toLowerCase() === "n") {
    console.clear();
    console.log("Se ha cancelado la creación del usuario\n");
    menuAdmin();
  } else {
    console.clear();
    console.log("No se ha especificado la confirmación correctamente");
    crearUsuario();
  }
}


// Funcion para eliminar un usuario
function eliminarUsuario() {
  console.clear();
  
  // Mostrar la lista de usuarios
  conexion.query("SELECT * FROM usuarios WHERE nombre_usuario != 'administrador'", (err, registros) => {
    if (err) throw err;

    if (registros.length === 0) {
      console.log("No hay usuarios para eliminar");
      menuAdmin();
    } else {
      console.log("Usuarios:");
      for (let i = 0; i < registros.length; i++) {
        let usuario = registros[i];
        console.log(`${i + 1}. ${usuario.nombre_usuario} ${usuario.apellidos_usuario} - ID: ${usuario.id_usuario}`);
      }

      // Solicitar el nombre del usuario que desea eliminar
      let idUsuario = readlineSync.question("\nIngrese el ID del usuario que desea eliminar: ");

      conexion.query("SELECT * FROM usuarios WHERE id_usuario = ?", [idUsuario], (err, registros) => {
        if (err) throw err;

        if (registros.length === 0) {
          console.log("El usuario no existe");
          return eliminarUsuario();
        }

        let usuario = registros[0]; // Solo deberia haber un registro


        console.log("\n-----------------------------------------------------------");
        console.log("\nSe eliminara el siguiente usuario con los siguientes datos: \n\nNombre de usuario: " + usuario.nombre_usuario + "\n\nApellidos del usuario: " + usuario.apellidos_usuario);
        let confirmacion = readlineSync.question("\nEstas seguro? [s/n] ");

        if (confirmacion.toLowerCase() === "s") {
          // Primero eliminar los contactos asociados a la agenda del usuario
          conexion.query("DELETE FROM contactos WHERE id_agenda = ?", [usuario.id_agenda], (err, resultado) => {
            if (err) throw err;

            // Luego eliminar la agenda del usuario
            conexion.query("DELETE FROM agendas WHERE id_agenda = ?", [usuario.id_agenda], (err, resultado) => {
              if (err) throw err;

              // Por último, eliminar el usuario
              conexion.query("DELETE FROM usuarios WHERE id_usuario = ?", [usuario.id_usuario], (err, resultado) => {
                if (err) throw err;

                console.clear();
                console.log("Usuario eliminado correctamente\n");
                menuAdmin();
              });
            });
          });
        } else if (confirmacion.toLowerCase() === "n") {
          console.clear();
          console.log("Se ha cancelado la eliminacion del usuario\n");
          menuAdmin();
        } else {
          eliminarUsuario();
        }
      });
    }
  });
}

function listarUsuariosAdmin() {
  // Seleccionar todos los usuarios excepto el administrador
  conexion.query("SELECT * FROM usuarios WHERE nombre_usuario != 'administrador'", (err, registros) => {
    if (err) throw err;

    // Si no se encuentra el usuario
    if (registros.length == 0) {
      console.clear();
      console.log("No hay usuarios\n");
    } else {
      // Mostrar Usuarios
      console.clear();
      console.log("Usuarios:");
      for (let i = 0; i < registros.length; i++) {
        let usuario = registros[i];
        console.log(`${i + 1}. ${usuario.nombre_usuario} ${usuario.apellidos_usuario} - ID: ${usuario.id_usuario}`);
      }
    }
    console.log("\n");
    menuAdmin();
  });
}

// Funcion para el menu del Usuario
function menuUsuario(usuarioId) {
  // Mostrar opciones
  console.log("--- Menu de la Agenda ---");
  console.log("1. Listar contactos");
  console.log("2. Crear contacto");
  console.log("3. Modificar contacto");
  console.log("4. Eliminar contacto");
  console.log("5. Cerrar sesion");

  // Pedir opcion
  let opcion = readlineSync.question("\nBienvenido, que accion va a realizar? ");

  // Ejecutar la opción seleccionada
  switch (opcion) {
    case "1":
      listarContactos(usuarioId);
      break;
    case "2":
      crearContacto(usuarioId);
      break;
    case "3":
      modificarContacto(usuarioId);
      break;
    case "4":
      eliminarContacto(usuarioId);
      break;
    case "5":
      console.log("Has salido del programa");
      desconectar();
      break;
    default:
      console.log("Opcion no valida");
      menuUsuario(usuarioId);
  }
}

function listarContactos(usuarioId) {
  console.clear();
  
  // Obtener la agenda del usuario
  conexion.query("SELECT id_agenda FROM usuarios WHERE id_usuario = ?", [usuarioId], (err, resultado) => {
    if (err) throw err;
    
    if (resultado.length === 0) {
      console.log("Usuario no encontrado");
      menuUsuario(usuarioId);
    } else {
      let idAgenda = resultado[0].id_agenda;

      // Listar los contactos asociados a la agenda del usuario
      conexion.query("SELECT * FROM contactos WHERE id_agenda = ?", [idAgenda], (err, registros) => {
        if (err) throw err;

        if (registros.length === 0) {
          console.log("No hay contactos en la agenda");
        } else {
          console.log("Contactos:");
          for (let i = 0; i < registros.length; i++) {
            let contacto = registros[i];
            console.log(`${i + 1}. ${contacto.nombre_contacto} ${contacto.apellidos_contacto}, Email: ${contacto.email_contacto}, Telefono: ${contacto.tlf_contacto}`);
          }
        }
        console.log("\n");
        menuUsuario(usuarioId);
      });
    }
  });
}

function crearContacto(usuarioId) {
  console.clear();

  // Pedir los datos de contacto
  let nombreContacto = readlineSync.question("Ingrese el nombre del contacto: ");
  let apellidosContacto = readlineSync.question("Ingrese los apellidos del contacto: ");
  let emailContacto = readlineSync.question("Ingrese el email del contacto: ");
  let tlfContacto = readlineSync.question("Ingrese el telefono del contacto: ");

  console.log("\n-----------------------------------------------------------");

  // Confirmacion por parte del usuario
  console.log("\nSe va a crear el siguiente contacto con los siguientes datos: \n\nNombre: " + nombreContacto + "\n\nApellidos: " + apellidosContacto + "\n\nEmail: " + emailContacto + "\n\nTelefono: " + tlfContacto);
  let confirmacion = readlineSync.question("\nEstas seguro? [s/n] ");

  if (confirmacion.toLowerCase() === "s") {
    // Obtener la agenda del usuario
    conexion.query("SELECT id_agenda FROM usuarios WHERE id_usuario = ?", [usuarioId], (err, resultado) => {
      if (err) throw err;

      if (resultado.length === 0) {
        console.log("Usuario no encontrado");
        menuUsuario(usuarioId);
      } else {
        let idAgenda = resultado[0].id_agenda;

        // Insercion en la tabla contactos
        conexion.query("INSERT INTO contactos (nombre_contacto, apellidos_contacto, email_contacto, tlf_contacto, id_agenda) VALUES (?, ?, ?, ?, ?)", 
        [nombreContacto, apellidosContacto, emailContacto, tlfContacto, idAgenda], (err, resultado) => {
          if (err) throw err;

          console.clear();
          console.log("Contacto creado correctamente\n");
          menuUsuario(usuarioId);
        });
      }
    });
  } else if (confirmacion.toLowerCase() === "n") {
    console.clear();
    console.log("\nSe ha cancelado la creacion del contacto\n");
    menuUsuario(usuarioId);
  } else {
    console.log("No se ha especificado la confirmacion correctamente");
    crearContacto(usuarioId);
  }
}

function modificarContacto(usuarioId) {
  console.clear();

  // Obtener la agenda del usuario
  conexion.query("SELECT id_agenda FROM usuarios WHERE id_usuario = ?", [usuarioId], (err, resultado) => {
    if (err) throw err;

    if (resultado.length === 0) {
      console.log("Usuario no encontrado");
      menuUsuario(usuarioId);
    } else {
      let idAgenda = resultado[0].id_agenda;

      // Listar los contactos asociados a la agenda del usuario
      conexion.query("SELECT * FROM contactos WHERE id_agenda = ?", [idAgenda], (err, registros) => {
        if (err) throw err;

        if (registros.length === 0) {
          console.log("No hay contactos en la agenda");
          menuUsuario(usuarioId);
        } else {
          console.log("Contactos:");
          for (let i = 0; i < registros.length; i++) {
            let contacto = registros[i];
            console.log(`${i + 1}. Nombre: ${contacto.nombre_contacto}, Apellidos: ${contacto.apellidos_contacto}, Email: ${contacto.email_contacto}, Telefono: ${contacto.tlf_contacto}`);
          }

          let contactoIndex = readlineSync.questionInt("\nIngrese el numero del contacto que desea modificar: ") - 1;

          if (contactoIndex < 0 || contactoIndex >= registros.length) {
            console.log("Numero de contacto invalido");
            return modificarContacto(usuarioId);
          }

          let contacto = registros[contactoIndex];

          console.log("\n-----------------------------------------------------------");

          console.log("\nModificando el siguiente contacto:\n\nNombre: " + contacto.nombre_contacto + "\nApellidos: " + contacto.apellidos_contacto + "\nEmail: " + contacto.email_contacto + "\nTelefono: " + contacto.tlf_contacto);

          console.log("\n-----------------------------------------------------------\n");

          // Pedir los nuevos datos
          let nuevoNombre = readlineSync.question("Ingrese el nuevo nombre del contacto: ");
          let nuevosApellidos = readlineSync.question("Ingrese los nuevos apellidos del contacto: ");
          let nuevoEmail = readlineSync.question("Ingrese el nuevo email del contacto: ");
          let nuevoTelefono = readlineSync.question("Ingrese el nuevo telefono del contacto: ");

          // Modificar el registro en la base de datos
          conexion.query("UPDATE contactos SET nombre_contacto = ?, apellidos_contacto = ?, email_contacto = ?, tlf_contacto = ? WHERE id_contacto = ?", 
            [nuevoNombre, nuevosApellidos, nuevoEmail, nuevoTelefono, contacto.id_contacto], (err, resultado) => {
              if (err) throw err;

              console.clear();
              console.log("Contacto modificado correctamente\n");
              menuUsuario(usuarioId);
          });
        }
      });
    }
  });
}

// Función para eliminar un contacto
function eliminarContacto(usuarioId) {
  console.clear();

  // Obtener la agenda del usuario
  conexion.query("SELECT id_agenda FROM usuarios WHERE id_usuario = ?", [usuarioId], (err, resultado) => {
    if (err) throw err;

    if (resultado.length === 0) {
      console.log("Usuario no encontrado");
      menuUsuario(usuarioId);
    } else {
      let idAgenda = resultado[0].id_agenda;

      // Listar los contactos asociados a la agenda del usuario
      conexion.query("SELECT * FROM contactos WHERE id_agenda = ?", [idAgenda], (err, registros) => {
        if (err) throw err;

        // Si no se encuentran contactos
        if (registros.length === 0) {
          console.log("No hay contactos en la agenda");
          menuUsuario(usuarioId);
        } else {

          // Mostrar contactos
          console.log("Contactos:");
          for (let i = 0; i < registros.length; i++) {
            let contacto = registros[i];
            console.log(`${i + 1}. Nombre: ${contacto.nombre_contacto}, Apellidos: ${contacto.apellidos_contacto}, Email: ${contacto.email_contacto}, Telefono: ${contacto.tlf_contacto}`);
          }

          // Seleccionar un contacto
          let contactoIndex = readlineSync.questionInt("\nIngrese el numero del contacto que desea eliminar: ") - 1;

          if (contactoIndex < 0 || contactoIndex >= registros.length) {
            eliminarContacto(usuarioId);
          }

          let contacto = registros[contactoIndex];

          console.log("\n-----------------------------------------------------------");

          // Confirmacion por parte del usuario
          console.log("\nSe va a eliminar el siguiente contacto:\n\nNombre: " + contacto.nombre_contacto + "\nApellidos: " + contacto.apellidos_contacto + "\nEmail: " + contacto.email_contacto + "\nTelefono: " + contacto.tlf_contacto);
          let confirmacion = readlineSync.question("\nEstas seguro? [s/n] ");

          if (confirmacion.toLowerCase() === "s") {
            // Borrar el registro de la base de datos
            conexion.query("DELETE FROM contactos WHERE id_contacto = ?", [contacto.id_contacto], (err, resultado) => {
              if (err) throw err;

              console.clear();
              console.log("Contacto eliminado correctamente\n");
              menuUsuario(usuarioId);
            });
          } else if (confirmacion.toLowerCase() === "n") {
            console.clear();
            console.log("Se ha cancelado la eliminacion del contacto\n");
            menuUsuario(usuarioId);
          } else {
            eliminarContacto(usuarioId);
          }
        }
      });
    }
  });
}

// Crear la base de datos
conexion.query("CREATE DATABASE IF NOT EXISTS agenda;");

// Usar el esquema de la base de datos
conexion.query("USE agenda;");

// Crear tablas para la base de datos y usuario administrador
conexion.query("CREATE TABLE IF NOT EXISTS agendas (id_agenda INT PRIMARY KEY);");

conexion.query("CREATE TABLE IF NOT EXISTS usuarios (id_usuario INT PRIMARY KEY, nombre_usuario VARCHAR(255), apellidos_usuario VARCHAR(255), contrasena_usuario VARCHAR(255), id_agenda INT, FOREIGN KEY (id_agenda) REFERENCES Agendas (id_agenda));");

conexion.query("CREATE TABLE IF NOT EXISTS contactos (id_contacto INT AUTO_INCREMENT PRIMARY KEY, nombre_contacto VARCHAR(255), apellidos_contacto VARCHAR(255), email_contacto VARCHAR(255), tlf_contacto VARCHAR(255), id_agenda INT, FOREIGN KEY (id_agenda) REFERENCES Agendas (id_agenda));");

conexion.query('INSERT IGNORE INTO usuarios VALUES (1, "administrador", null, "1234", null);');

// Evento connect: se ejecuta cuando se establece la conexion
conexion.on('connect', function () {
  console.clear();
  console.log('Conexion establecida correctamente');
  // Llamar a la funcion del login despues de 1s
  setTimeout (
    login, 1000);
});

// Evento error: se ejecuta cuando ocurre un error en la conexion
conexion.on('error', function (err) {
  console.error('Error de conexion:', err);
});