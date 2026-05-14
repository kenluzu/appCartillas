USE [dbCartillas]
GO
/****** Objeto: Table [dbo].[cartillas] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[cartillas](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[usuario_id] [int] NULL,
	[puntos] [int] NULL,
	[estado] [varchar](20) NULL,
	[fecha_inicio] [datetime] NULL,
	[fecha_cierre] [datetime] NULL,
	[url_imagen] [varchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[comercial_cumplimiento] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[comercial_cumplimiento](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[usuario] [varchar](50) NOT NULL,
	[volumen] [decimal](18, 2) NOT NULL,
	[utilidad] [decimal](18, 2) NOT NULL,
	[estrategica] [decimal](18, 2) NOT NULL,
	[tickets] [int] NOT NULL,
	[ultima_fecha_modificacion] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[farmacias] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[farmacias](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [varchar](100) NOT NULL,
	[direccion] [varchar](200) NULL,
	[latitud] [decimal](10, 8) NULL,
	[longitud] [decimal](11, 8) NULL,
	[cantidad] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[productos] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[productos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[tipo] [varchar](100) NOT NULL,
	[cod_producto] [int] NOT NULL,
	[nombre] [varchar](255) NOT NULL,
	[laboratorio] [varchar](255) NULL,
	[activo] [bit] NOT NULL,
 CONSTRAINT [PK_productos] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_productos_cod_producto] UNIQUE NONCLUSTERED 
(
	[cod_producto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[retiros] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[retiros](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[cartilla_id] [int] NULL,
	[farmacia_id] [int] NULL,
	[fecha_retiro] [date] NOT NULL,
	[hora_retiro] [time](7) NOT NULL,
	[estado] [varchar](20) NULL,
	[fecha_creacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[retos] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[retos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[cartilla_id] [int] NOT NULL,
	[tipo_reto] [varchar](50) NOT NULL,
	[monto] [decimal](10, 2) NOT NULL,
	[numero_factura] [varchar](100) NULL,
	[descripcion] [varchar](500) NULL,
	[fecha_registro] [datetime] NOT NULL,
	[estado] [varchar](20) NOT NULL,
	[tickets] [int] NOT NULL,
	[cedula_referido] [varchar](13) NULL,
	[celular_referido] [varchar](15) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[sis_params] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sis_params](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[key] [varchar](100) NOT NULL,
	[value] [varchar](500) NOT NULL,
 CONSTRAINT [PK_sis_params] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_sis_params_key] UNIQUE NONCLUSTERED 
(
	[key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Objeto: Table [dbo].[usuarios] Fecha de script: 14/5/2026 17:58:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[usuarios](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[cedula] [varchar](13) NOT NULL,
	[nombre] [varchar](100) NOT NULL,
	[apellido] [varchar](100) NOT NULL,
	[telefono] [varchar](20) NOT NULL,
	[password] [varchar](255) NULL,
	[rol] [varchar](10) NOT NULL,
	[fecha_registro] [datetime] NULL,
	[canal] [varchar](20) NULL,
	[cod_cliente] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[cedula] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[cartillas] ADD  DEFAULT ((0)) FOR [puntos]
GO
ALTER TABLE [dbo].[cartillas] ADD  DEFAULT ('activa') FOR [estado]
GO
ALTER TABLE [dbo].[cartillas] ADD  DEFAULT (getdate()) FOR [fecha_inicio]
GO
ALTER TABLE [dbo].[comercial_cumplimiento] ADD  DEFAULT ((0)) FOR [volumen]
GO
ALTER TABLE [dbo].[comercial_cumplimiento] ADD  DEFAULT ((0)) FOR [utilidad]
GO
ALTER TABLE [dbo].[comercial_cumplimiento] ADD  DEFAULT ((0)) FOR [estrategica]
GO
ALTER TABLE [dbo].[comercial_cumplimiento] ADD  DEFAULT ((0)) FOR [tickets]
GO
ALTER TABLE [dbo].[comercial_cumplimiento] ADD  DEFAULT (getdate()) FOR [ultima_fecha_modificacion]
GO
ALTER TABLE [dbo].[farmacias] ADD  DEFAULT ((0)) FOR [cantidad]
GO
ALTER TABLE [dbo].[productos] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[retiros] ADD  DEFAULT ('pendiente') FOR [estado]
GO
ALTER TABLE [dbo].[retiros] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[retos] ADD  DEFAULT (getdate()) FOR [fecha_registro]
GO
ALTER TABLE [dbo].[retos] ADD  DEFAULT ('registrado') FOR [estado]
GO
ALTER TABLE [dbo].[retos] ADD  DEFAULT ((1)) FOR [tickets]
GO
ALTER TABLE [dbo].[usuarios] ADD  DEFAULT ('CONSUMER') FOR [rol]
GO
ALTER TABLE [dbo].[usuarios] ADD  DEFAULT (getdate()) FOR [fecha_registro]
GO
ALTER TABLE [dbo].[cartillas]  WITH CHECK ADD FOREIGN KEY([usuario_id])
REFERENCES [dbo].[usuarios] ([id])
GO
ALTER TABLE [dbo].[retiros]  WITH CHECK ADD FOREIGN KEY([cartilla_id])
REFERENCES [dbo].[cartillas] ([id])
GO
ALTER TABLE [dbo].[retiros]  WITH CHECK ADD FOREIGN KEY([farmacia_id])
REFERENCES [dbo].[farmacias] ([id])
GO
ALTER TABLE [dbo].[usuarios]  WITH CHECK ADD CHECK  (([rol]='CONSUMER' OR [rol]='ADMIN'))
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'id externo de datamart' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'usuarios', @level2type=N'COLUMN',@level2name=N'cod_cliente'
GO
