# Actividad integradora

En esta actividad se busca poner en practica seis de los temas principales
del curso de Organización del Desarrollo:

- Estándares de codificación
- Versionado de la base de datos
- Tests
- Chequeos estáticos
- Dependencias
- Seguimiento por tickets
- Gitflow

## Actividad

Para la actividad integradora, se piden **resolver las [issues](https://github.com/Mikroways/organizacion-del-desarrollo-actividad-integradora/issues)
planteadas en el repositorio original en un fork en una cuenta propia**. La
solución debe cumplir los siguientes puntos

- El código debe pasar la configuración de eslint sin errores.
- El código debe pasar los tests escritos.
- Se deben escribir nuevos casos de prueba para los cambios en el esquema
  planteados, teniendo en cuenta al menos un caso límite para cada columna.
- Se debe adoptar un esquema de git para resolver las **issues**. Las ramas
  generadas deben quedarse en el repositorio para su posterior validación

## Requerimientos

Primero que nada, este repositorio es un template, por lo que podés hacer click
en el botón **Use this template** y arrancar en una copia en tu espacio de
trabajo. Luego, al momento de iniciar el ambiente, tenemos 3 alternativas.

### Codespaces github

Desde el repositorio en github, identificar el botón `Code` y seleccionar la
pestaña `Codespaces`. Luego, crear el Codespace a partir de la rama deseada.

### Devcontainers vscode

- [Plugin dev containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [`docker`](https://docs.docker.com/engine/install/)

Luego de instalar el plugin y docker, presionar `F1` y ejecutar
`devcontainer reopen container`. Esto va a generar la imagen y va a abrir una
nueva ventana de VSCode dentro del contenedor.

### Devcontainers CLI

- [Dev containers CLI](https://www.npmjs.com/package/@devcontainers/cli)
- [`npm`](https://www.npmjs.com/): Viene incluido en la instalación de node con
  `asdf`
- [`docker`](https://docs.docker.com/engine/install/)

Instalar las dependencias del proyecto con `npm` e instalar docker. Una vez
instalado todo, ejecutar:

```bash
npm run devcontainers:start
npm run devcontainers:shell
```

Desde dentro del contenedor vamos a poder trabajar con todas las herramientas
necesarias.

### Instalación manual

- [`asdf`](https://asdf-vm.com/)
  - Plugins de asdf
    - [`direnv`](https://direnv.net/): https://github.com/asdf-community/asdf-direnv
    - [`node`](https://nodejs.org/en): https://github.com/asdf-vm/asdf-nodejs
    - [`npm`](https://www.npmjs.com/): Viene incluido en la instalación de node
      con `asdf`
      - Como alternativa, se tiene como dependencia de node
    - [`atlas`](https://atlasgo.io/): https://github.com/pbr0ck3r/asdf-atlas.git
    - [`dbmate`](https://github.com/amacneil/dbmate): https://github.com/juusujanar/asdf-dbmate
- [`docker`](https://docs.docker.com/engine/install/)

## Iniciar base de datos

Para iniciar la base de datos se propone usar dockercompose, para ello, solo
hace falta tener instalado docker y ejecutar

```bash
docker compose up -d
```

Como alternativa, se puede ejecutar el contenedor directamente con docker

```bash
docker run --rm \
  -p 5432:5432
  -e POSTGRES_DB=tdd_database \
  -e POSTGRES_USER=tdd_database \
  -e POSTGRES_PASSWORD=tdd_database \
  postgres:16
```

## Aplicar migraciones

Al momento de aplicar las migraciones tenemos 2 alternativas, usar `Atlas` o
`dbmate`. El método que seleccionemos, debemos mantenerlo a lo largo de la
actividad para permitir el correcto seguimiento de la aplicación de dichas
migraciones.

### Atlas

Es un producto agnostico, definido como el terraform para base de datos. Esto es
por su forma de generar las migraciones a partir de un archivo en formato `hcl`,
formato definido y mantenido por `hashicorp`, creador de terraform. Esto nos
permite aplicar un enfoque similar al de Infraestructura como códogo, usado por terraform, para dejar definido en forma de códgo toda modificación a la
infraestructura. En este caso, a medida que agreguemos cambios al archivo
`schema.hcl` generar las migraciones en formato `sql`. En el apartado `Generar migraciones` se va a
tratar más en detalle el flujo completo para la creación de nuevas migraciones.

```bash
cd atlas
atlas migrate apply --env local
```

### dbmate

Es un producto agnostico, pero mucho más acotado y con un funcionamiento más
simple, para generar y aplicar migraciones en formato `sql`. En el apartado
`Generar migraciones` se va a tratar más en detalle el flujo completo para la
creación de nuevas migraciones.

```bash
cd dbmate
dbmate up
```

## Ejecución de las pruebas

Para ejecutar las pruebas, se deben instalar las dependencias

```bash
npm i
```

Luego, simplemente ejecutar

```bash
npm test
```

## Generar migraciones

Para generar migraciones es necesario seguir trabajando con el producto con el
cual se aplicaron las migraciones ya definidas en este repositorio.

### Atlas

Atlas se configura mediante un archivo centralizado llamado `atlas.hcl`, en el
cual se definen diferentes parametros por defecto al usar el ambiente `local`.
En el archivo se pueden encontrar explicados cada uno de los campos usados. Por
otro lado, se define un archivo central donde definimos el esquema llamado
`schema.hcl`. Para generar una nueva migración, modificar dicho archivo
agregando o cambiando algun dato de la tabla y luego ejecutar

```bash
atlas migrate diff <NOMBRE_MIGRACION> --env local
```

Esto va a realizar 2 acciones, generar un archivo con el formato 
`<TIMESTAMP>_<NOMBRE_MIGRACION>.sql` en el directorio `migrations`. Por otro
lado, va a modificar el archivo de hash de cada migración, almacenado en
`migrations/atlas.sum`

Una vez generada la migración, podemos validar el estado actual ejecutando

```bash
atlas migrate status --env local
```

En el comando anterior deberiamos ver que queda pendiente por aplicar una
migración.

Luego, podemos validar lo que se va a aplicar ejecutando el comando

```bash
atlas migrate apply --env local --dry-run
```

Finalmente, para aplicar las migraciones, ejecutar

```bash
atlas migrate apply --env local
```

### dbmate

dbmate usa un directorio donde almacena todos los archivos `sql` a aplicar en
formato de migraciones. Para crear una nueva migración, ejecutar

```bash
dbmate new <NOMBRE_MIGRACION>
```

Esto va a generar un archivo `sql` con el formato
`<TIMESTAMP>_<NOMBRE_MIGRACION>.sql` en el directorio `db/migrations`. Dentro,
se pueden encontrar 2 comentarios marcando que sentencias se van a ejecutar en
la aplicación de la migración, y que sentencias en el rollback. Una vez escritas
todas las sentencias necesarias, podemos validar el estado ejecutando

```bash
dbmate status
```

Finalmente, para aplicar las migraciones, ejecutar

```bash
dbmate up
```
