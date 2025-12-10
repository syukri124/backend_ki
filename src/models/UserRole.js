module.exports = (sequelize, DataTypes) => {
  const UserRoles = sequelize.define("UserRoles", {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
  });

  return UserRoles;
};
