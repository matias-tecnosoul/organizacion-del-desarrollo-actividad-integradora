const { Client } = require('pg');
const {
  /**
   * Recuperamos el esquema esperado
   *
   * Para una primer etapa, se recomienda importar la propiedad
   * "baseFields" reenombrandola a "expectedFields"
   */
  baseFields: expectedFields,
} = require('./schema_base');

describe('Test database', () => {
  /**
   * Variables globales usadas por diferentes tests
   */
  let client;

  /**
   * Generamos la configuracion con la base de datos y
   * hacemos la consulta sobre los datos de la tabla "users"
   *
   * Se hace en la etapa beforeAll para evitar relizar la operación
   * en cada test
   */
  beforeAll(async () => {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    // CAMBIO 1: Configurar timezone a UTC para consistencia
    await client.query("SET timezone = 'UTC'");
  });

  /**
   * Cerramos la conexion con la base de datos
   */
  afterAll(async () => {
    await client.end();
  });

  /**
   * Validamos el esquema de la base de datos
   */
  describe('Validate database schema', () => {
    /**
     * Variable donde vamos a almacenar los campos
     * recuperados de la base de datos
     */
    let fields;
    let result;

    /**
     * Generamos un objeto para simplificar el acceso en los test
     */
    beforeAll(async () => {
      /**
       * Consulta para recuperar la información de la tabla
       * "users"
       */
      result = await client.query(
        `SELECT
          column_name, data_type
        FROM
          information_schema.columns
        WHERE
          table_name = $1::text`,
        ['users'],
      );

      fields = result.rows.reduce((acc, field) => {
        acc[field.column_name] = field.data_type;
        return acc;
      }, {});
    });

    describe('Validate fields name', () => {
      /**
       * Conjunto de tests para validar que los campos esperados se
       * encuentren presentes
       */
      test.each(expectedFields)('Validate field $name', ({ name }) => {
        expect(Object.keys(fields)).toContain(name);
      });
    });

    describe('Validate fields type', () => {
      /**
       * Conjunto de tests para validar que los campos esperados sean
       * del tipo esperado
       */
      test.each(expectedFields)('Validate field $name to be type "$type"', ({ name, type }) => {
        expect(fields[name]).toBe(type);
      });
    });
  });

  describe('Validate insertion', () => {
    afterEach(async () => {
      await client.query('TRUNCATE users');
    });

    test('Insert a valid user', async () => {
      let result = await client.query(
        `INSERT INTO
         users (email, username, birthdate, city)
         VALUES ('user@example.com', 'user', '2024-01-02', 'La Plata')`,
      );

      expect(result.rowCount).toBe(1);

      result = await client.query(
        'SELECT * FROM users',
      );

      const user = result.rows[0];
      const userCreatedAt = new Date(user.created_at);
      const currentDate = new Date();

      expect(user.email).toBe('user@example.com');
      expect(userCreatedAt.getFullYear()).toBe(currentDate.getFullYear());
    });

    test('Insert a user with an invalid email', async () => {
      const query = `INSERT INTO
                     users (email, username, birthdate, city)
                     VALUES ('user', 'user', '2024-01-02', 'La Plata')`;

      await expect(client.query(query)).rejects.toThrow('users_email_check');
    });

    test('Insert a user with an invalid birthdate', async () => {
      const query = `INSERT INTO
                     users (email, username, birthdate, city)
                     VALUES ('user@example.com', 'user', 'invalid_date', 'La Plata')`;

      await expect(client.query(query)).rejects.toThrow('invalid input syntax for type date');
    });

    test('Insert a user without city', async () => {
      const query = `INSERT INTO
                     users (email, username, birthdate)
                     VALUES ('user@example.com', 'user', '2024-01-02')`;

      await expect(client.query(query)).rejects.toThrow('null value in column "city"');
    });
  });

  /**
   * Validamos los nuevos campos agregados al esquema
   */
  describe('Validate new fields', () => {
    afterEach(async () => {
      await client.query('TRUNCATE users');
    });

    /**
     * Función auxiliar para insertar un usuario base
     */
    async function insertBaseUser() {
      const result = await client.query(
        `INSERT INTO
         users (email, username, birthdate, city)
         VALUES ('test@example.com', 'testuser', '2000-01-01', 'Test City')
         RETURNING *`,
      );
      return result;
    }

    /**
     * Función auxiliar para actualizar un usuario existente
     */
    async function updateUser(email, updateData) {
      const setClauses = Object.entries(updateData)
        .map(([key, value]) => {
          if (value === null) {
            return `${key} = NULL`;
          }
          if (typeof value === 'string' && !value.includes('now()')) {
            return `${key} = '${value}'`;
          }
          return `${key} = ${value}`;
        })
        .join(', ');

      const result = await client.query(
        `UPDATE users 
         SET ${setClauses} 
         WHERE email = '${email}' 
         RETURNING *`,
      );
      return result;
    }

    /**
     * Tests para el campo updated_at
     */
    describe('updated_at field', () => {
      test('should allow setting updated_at to current timestamp', async () => {
        // Insertar usuario base
        await insertBaseUser();

        // Actualizar updated_at a now()
        const result = await client.query(
          `UPDATE users 
           SET updated_at = now() 
           WHERE email = 'test@example.com' 
           RETURNING *`,
        );

        // Verificar que updated_at no es null
        expect(result.rows[0].updated_at).not.toBeNull();
      });

      test('should allow setting updated_at to NULL', async () => {
        // Insertar usuario base
        await insertBaseUser();

        // Actualizar updated_at a NULL
        const result = await updateUser('test@example.com', { updated_at: null });

        // Verificar que updated_at es null
        expect(result.rows[0].updated_at).toBeNull();
      });

      test('should handle far future dates for updated_at', async () => {
        await insertBaseUser();
        // CAMBIO 2: Fecha explícita con timezone UTC

        // Fecha en el futuro lejano: 31 de diciembre de 9999
        const result = await updateUser('test@example.com', { updated_at: '9999-12-31 23:59:59+00' }); // Mediodía UTC explícito

        // Verificar que la fecha se guardó correctamente
        expect(result.rows[0].updated_at).not.toBeNull();
        const storedDate = new Date(result.rows[0].updated_at);
        expect(storedDate.getUTCFullYear()).toBe(9999);
        expect(storedDate.getUTCMonth()).toBe(11);
        expect(storedDate.getUTCDate()).toBe(31);
        expect(storedDate.getUTCHours()).toBe(23); //  Verificar la hora también
        expect(storedDate.getUTCMinutes()).toBe(59);
      });
    });

    /**
     * Tests para los campos first_name y last_name
     */
    describe('name fields', () => {
      test('should allow setting first_name and last_name', async () => {
        await insertBaseUser();

        const result = await updateUser('test@example.com', {
          first_name: 'John',
          last_name: 'Doe',
        });

        expect(result.rows[0].first_name).toBe('John');
        expect(result.rows[0].last_name).toBe('Doe');
      });

      test('should handle long names up to 50 characters', async () => {
        await insertBaseUser();

        const longName = 'A'.repeat(50); // Nombre de 50 caracteres
        const result = await updateUser('test@example.com', {
          first_name: longName,
          last_name: longName,
        });

        expect(result.rows[0].first_name.length).toBe(50);
        expect(result.rows[0].last_name.length).toBe(50);
      });

      test('should handle special characters in names', async () => {
        await insertBaseUser();

        const specialName = 'Tito Puente';
        const result = await updateUser('test@example.com', {
          first_name: specialName,
          last_name: specialName,
        });

        expect(result.rows[0].first_name).toBe(specialName);
        expect(result.rows[0].last_name).toBe(specialName);
      });
    });

    /**
     * Tests para el campo password
     */
    describe('password field', () => {
      test('should allow setting password', async () => {
        await insertBaseUser();

        const result = await updateUser('test@example.com', {
          password: 'securePassword123!',
        });

        expect(result.rows[0].password).toBe('securePassword123!');
      });

      test('should handle passwords up to 100 characters', async () => {
        await insertBaseUser();

        const longPassword = 'P@ssw0rd'.repeat(13).substring(0, 100); // 100 caracteres
        const result = await updateUser('test@example.com', {
          password: longPassword,
        });

        expect(result.rows[0].password.length).toBe(100);
        expect(result.rows[0].password).toBe(longPassword);
      });

      test('should handle special characters in passwords', async () => {
        await insertBaseUser();

        const specialPassword = '!@#$-_+.';
        const result = await updateUser('test@example.com', {
          password: specialPassword,
        });

        expect(result.rows[0].password).toBe(specialPassword);
      });
    });

    /**
     * Tests para el campo enabled
     */
    describe('enabled field', () => {
      test('should default to true when not specified', async () => {
        const result = await insertBaseUser();

        // Verificar que enabled es true por defecto
        expect(result.rows[0].enabled).toBe(true);
      });

      test('should allow setting enabled to false', async () => {
        await insertBaseUser();

        const result = await updateUser('test@example.com', { enabled: false });

        expect(result.rows[0].enabled).toBe(false);
      });

      test('should allow setting enabled back to true', async () => {
        await insertBaseUser();

        // Primero cambiamos a false
        await updateUser('test@example.com', { enabled: false });

        // Luego volvemos a true
        const result = await updateUser('test@example.com', { enabled: true });

        expect(result.rows[0].enabled).toBe(true);
      });
    });

    /**
     * Tests para el campo last_access_time
     */
    describe('last_access_time field', () => {
      test('should allow setting last_access_time', async () => {
        await insertBaseUser();

        const nowTimestamp = new Date().toISOString();
        const result = await updateUser('test@example.com', {
          last_access_time: nowTimestamp,
        });

        expect(result.rows[0].last_access_time).not.toBeNull();
      });

      test('should allow setting last_access_time to NULL', async () => {
        await insertBaseUser();

        const result = await updateUser('test@example.com', {
          last_access_time: null,
        });

        expect(result.rows[0].last_access_time).toBeNull();
      });

      test('should handle far past dates for last_access_time', async () => {
        await insertBaseUser();

        // Fecha en el pasado lejano: 1 de enero de 1900
        const result = await updateUser('test@example.com', {
          last_access_time: '1900-01-01 00:00:00+00',
        });

        // Verificar que la fecha se guardó correctamente
        expect(result.rows[0].last_access_time).not.toBeNull();
        const storedDate = new Date(result.rows[0].last_access_time);
        expect(storedDate.getUTCFullYear()).toBe(1900);
        expect(storedDate.getUTCMonth()).toBe(0); // Enero es 0
        expect(storedDate.getUTCDate()).toBe(1);
      });
    });

    /**
     * Test para todos los campos juntos
     */
    describe('All new fields together', () => {
      test('should handle all new fields together in a single update', async () => {
        await insertBaseUser();

        const now = new Date().toISOString();
        const result = await updateUser('test@example.com', {
          updated_at: now,
          first_name: 'John',
          last_name: 'Doe',
          password: 'securePassword123!',
          enabled: false,
          last_access_time: now,
        });

        expect(result.rows[0].updated_at).not.toBeNull();
        expect(result.rows[0].first_name).toBe('John');
        expect(result.rows[0].last_name).toBe('Doe');
        expect(result.rows[0].password).toBe('securePassword123!');
        expect(result.rows[0].enabled).toBe(false);
        expect(result.rows[0].last_access_time).not.toBeNull();
      });
    });
  });
});
