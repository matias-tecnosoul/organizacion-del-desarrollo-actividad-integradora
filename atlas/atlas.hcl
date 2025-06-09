env "local" {
  # Archivo central donde se definen los schemas
  # Es posible el uso de un directorio, ej:
  # src = "file://schemas"
  src = "file://schema.hcl"

  # Referencia a una base de datos usada de forma temporal para validar schemas
  # Para más información, ver https://atlasgo.io/concepts/dev-database
  dev = "docker://postgres/16/dev"

  # URL de la base de datos a usar, para evitar versionar credenciales, se 
  # usa la variable DATABASE_URL definida con direnv
  # Para más información, ver https://atlasgo.io/concepts/url
  url = getenv("DATABASE_URL")

  # Configuración de las migraciones generadas
  migration {
    dir = "file://migrations"
  }

  # Formato por defecto usado por el comando "atlas migrate diff"
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
