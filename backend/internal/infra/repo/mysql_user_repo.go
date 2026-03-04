package repo

import (
	"github.com/google/uuid"
	"github.com/phuongaz/chatchat/internal/domain/user"
	"github.com/phuongaz/chatchat/internal/infra/models"
	"gorm.io/gorm"
)

type mysqlUserRepo struct {
	db *gorm.DB
}

func NewMysqlUserRepo(db *gorm.DB) user.UserRepository {
	return &mysqlUserRepo{db: db}
}

func (r *mysqlUserRepo) FindByID(id string) (*user.User, error) {

	var userModel models.User
	result := r.db.Where("id = ?", id).First(&userModel)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user.User{
		ID:                  userModel.ID.String(),
		Username:            userModel.Username,
		PublicKey:           userModel.PublicKey,
		Salt:                userModel.Salt,
		IV:                  userModel.IV,
		PrivateEncryptedKey: userModel.PrivateEncryptedKey,
		CreatedAt:           userModel.CreatedAt,
		UpdatedAt:           userModel.UpdatedAt,
	}, nil
}

func (r *mysqlUserRepo) FindByUsername(username string) (*user.User, error) {
	var userModel models.User
	result := r.db.Where("username = ?", username).First(&userModel)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user.User{
		ID:                  userModel.ID.String(),
		Username:            userModel.Username,
		Password:            userModel.Password,
		PublicKey:           userModel.PublicKey,
		PrivateEncryptedKey: userModel.PrivateEncryptedKey,
		Salt:                userModel.Salt,
		IV:                  userModel.IV,
		CreatedAt:           userModel.CreatedAt,
		UpdatedAt:           userModel.UpdatedAt,
	}, nil
}

func (r *mysqlUserRepo) Create(user user.User) error {
	return r.db.Create(&models.User{
		ID:                  uuid.New(),
		Username:            user.Username,
		Password:            user.Password,
		PublicKey:           user.PublicKey,
		PrivateEncryptedKey: user.PrivateEncryptedKey,
		IV:                  user.IV,
		Salt:                user.Salt,
	}).Error
}

func (r *mysqlUserRepo) SearchUser(query string) ([]*user.User, error) {
	var users []*models.User
	result := r.db.Where("username LIKE ?", "%"+query+"%").Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	usersResponse := make([]*user.User, len(users))
	for i, u := range users {
		usersResponse[i] = &user.User{
			ID:        u.ID.String(),
			Username:  u.Username,
			PublicKey: u.PublicKey,
		}
	}
	return usersResponse, nil
}

func (r *mysqlUserRepo) GetPublicKey(userID string) (string, error) {
	var userModel models.User
	result := r.db.Where("id = ?", userID).First(&userModel)
	if result.Error != nil {
		return "", result.Error
	}
	return userModel.PublicKey, nil
}
