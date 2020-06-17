module.exports = (sequelize, type) => {
    return sequelize.define('rfid-master', {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        id_kartu: type.STRING(510),
        status_kartu: type.STRING(510),
        nama_kartu: type.STRING(510),
        last_tap: type.DATE,
        period: type.INTEGER
    })
}