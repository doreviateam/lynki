package auth

import (
	"errors"
	"fmt"
	"strings"
)

// Role représente un rôle utilisateur
type Role string

const (
	RoleAdmin    Role = "admin"
	RoleAuditor  Role = "auditor"
	RoleOperator Role = "operator"
	RoleViewer   Role = "viewer"
)

// Permission représente une permission RBAC
type Permission string

const (
	PermissionReadDocuments   Permission = "documents:read"
	PermissionWriteDocuments  Permission = "documents:write"
	PermissionReadAudit       Permission = "audit:read"
	PermissionReadLedger      Permission = "ledger:read"
	PermissionDocumentsVerify Permission = "documents:verify"
	PermissionReconcileExecute Permission = "reconcile:execute"
	PermissionManageUsers     Permission = "users:manage"
)

// RBACService gère les vérifications RBAC
type RBACService struct {
	rolePermissions map[Role][]Permission
}

// NewRBACService crée un nouveau service RBAC avec les mappings par défaut
func NewRBACService() *RBACService {
	return &RBACService{
		rolePermissions: map[Role][]Permission{
			RoleAdmin: {
				PermissionReadDocuments, PermissionWriteDocuments, PermissionReadAudit,
				PermissionReadLedger, PermissionDocumentsVerify, PermissionReconcileExecute,
				PermissionManageUsers,
			},
			RoleAuditor: {
				PermissionReadDocuments, PermissionReadAudit, PermissionDocumentsVerify,
			},
			RoleOperator: {
				PermissionReadDocuments, PermissionWriteDocuments, PermissionReadAudit,
			},
			RoleViewer: {
				PermissionReadDocuments,
			},
		},
	}
}

// HasPermission indique si un rôle possède une permission
func (r *RBACService) HasPermission(role Role, perm Permission) bool {
	perms, ok := r.rolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

// RequirePermission vérifie que l'utilisateur a la permission ; retourne une erreur sinon
func (r *RBACService) RequirePermission(userInfo *UserInfo, perm Permission) error {
	if userInfo == nil {
		return errors.New("user not authenticated")
	}
	role, err := ParseRole(userInfo.Role)
	if err != nil {
		return fmt.Errorf("invalid role: %w", err)
	}
	if !r.HasPermission(role, perm) {
		return fmt.Errorf("permission denied: role %s lacks %s", role, perm)
	}
	return nil
}

// GetRolePermissions retourne la liste des permissions d'un rôle
func (r *RBACService) GetRolePermissions(role Role) []Permission {
	perms := r.rolePermissions[role]
	if perms == nil {
		return nil
	}
	result := make([]Permission, len(perms))
	copy(result, perms)
	return result
}

// ParseRole parse une chaîne en Role (insensible à la casse)
func ParseRole(s string) (Role, error) {
	norm := strings.ToLower(strings.TrimSpace(s))
	switch norm {
	case string(RoleAdmin):
		return RoleAdmin, nil
	case string(RoleAuditor):
		return RoleAuditor, nil
	case string(RoleOperator):
		return RoleOperator, nil
	case string(RoleViewer):
		return RoleViewer, nil
	default:
		return "", fmt.Errorf("invalid role: %s", s)
	}
}

// IsValidRole indique si la chaîne est un rôle valide
func IsValidRole(s string) bool {
	_, err := ParseRole(s)
	return err == nil
}

// GetRequiredPermission mappe un endpoint à la permission requise
func GetRequiredPermission(endpoint string) (Permission, error) {
	path := strings.TrimRight(endpoint, "/")
	switch {
	case strings.HasPrefix(path, "/api/v1/invoices") || path == "/api/v1/invoices":
		return PermissionWriteDocuments, nil
	case strings.HasPrefix(path, "/api/v1/ledger/export") || path == "/api/v1/ledger/export":
		return PermissionReadLedger, nil
	case strings.HasPrefix(path, "/audit/export") || path == "/audit/export":
		return PermissionReadAudit, nil
	case strings.HasPrefix(path, "/api/v1/ledger/verify") || strings.Contains(path, "/ledger/verify/"):
		return PermissionDocumentsVerify, nil
	case strings.HasPrefix(path, "/documents") || path == "/documents":
		return PermissionReadDocuments, nil
	case strings.HasPrefix(path, "/download/"):
		return PermissionReadDocuments, nil
	default:
		return "", fmt.Errorf("unknown endpoint: %s", endpoint)
	}
}
