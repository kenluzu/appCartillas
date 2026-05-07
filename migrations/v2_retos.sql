-- =====================================================
-- Ponte la 10 - Migración v2
-- Nuevas funcionalidades: retos, cartillas de 10 puntos
-- Fecha: 2026-05-07
-- Ejecutar en SQL Server sobre dbCartillas
-- =====================================================

-- 1. Crear tabla retos (registros de cada reto completado)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'retos')
BEGIN
    CREATE TABLE retos (
        id              INT             IDENTITY(1,1) PRIMARY KEY,
        cartilla_id     INT             NOT NULL,
        tipo_reto       VARCHAR(50)     NOT NULL,
        -- Valores: 'contact_center' | 'referido' | 'lineas_estrategicas' | 'productos_focos'
        monto           DECIMAL(10,2)   NOT NULL,
        numero_factura  VARCHAR(100)    NULL,
        descripcion     VARCHAR(500)    NULL,
        fecha_registro  DATETIME        NOT NULL DEFAULT GETDATE(),
        estado          VARCHAR(20)     NOT NULL DEFAULT 'registrado'
    );
    PRINT 'Tabla retos creada correctamente.';
END
ELSE
    PRINT 'La tabla retos ya existe, se omite.';

-- 2. Agregar campo canal a usuarios (almacena CORPORATIVO/COMERCIAL)
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('usuarios') AND name = 'canal'
)
BEGIN
    ALTER TABLE usuarios ADD canal VARCHAR(20) NULL;
    PRINT 'Campo canal agregado a tabla usuarios.';
END
ELSE
    PRINT 'El campo canal ya existe en usuarios, se omite.';

-- =====================================================
-- NOTAS IMPORTANTES:
--
-- * El máximo de puntos por cartilla cambió de 20 → 10.
--   No requiere cambio de esquema ya que el campo puntos
--   es INT sin restricción de máximo. El límite se aplica
--   en el código de la aplicación.
--
-- * Al completarse una cartilla (10 puntos), el estado
--   pasa a "completa". Una nueva cartilla se crea
--   automáticamente cuando el usuario lo solicita.
--
-- * La tabla retiros/plan_retiro se mantiene para historial
--   pero ya no se usa en el nuevo flujo de la aplicación.
-- =====================================================
