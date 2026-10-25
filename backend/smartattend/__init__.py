# Configure PyMySQL as MySQLdb for native Django MySQL backend support
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
