import apiClient from "./apiClient";

/** Admin API methods. The backend enforces role permissions on every route. */
const adminService = {
  getOverview() {
    return apiClient.get("/admin/overview/").then((response) => response.data);
  },
  listUsers(params = {}) {
    return apiClient.get("/admin/users/", { params }).then((response) => response.data);
  },
  updateUser(id, payload) {
    return apiClient.patch(`/admin/users/${id}/`, payload).then((response) => response.data);
  },
  getUser(id) {
    return apiClient.get(`/admin/users/${id}/`).then((response) => response.data);
  },
  unlinkUserProvider(id, provider) {
    return apiClient.delete(`/admin/users/${id}/identities/${encodeURIComponent(provider)}/`).then((response) => response.data);
  },
  listRoles(params = {}) {
    return apiClient.get("/admin/roles/", { params }).then((response) => response.data);
  },
  saveRole(id, payload) {
    const request = id
      ? apiClient.patch(`/admin/roles/${id}/`, payload)
      : apiClient.post("/admin/roles/", payload);
    return request.then((response) => response.data);
  },
  deleteRole(id) {
    return apiClient.delete(`/admin/roles/${id}/`);
  },
  updateUserRoles(id, role_ids) {
    return apiClient.patch(`/admin/users/${id}/roles/`, { role_ids }).then((response) => response.data);
  },
  listTopics(params = {}) {
    return apiClient.get("/admin/vocabulary/topics/", { params }).then((response) => response.data);
  },
  saveTopic(id, payload) {
    const request = id
      ? apiClient.patch(`/admin/vocabulary/topics/${id}/`, payload)
      : apiClient.post("/admin/vocabulary/topics/", payload);
    return request.then((response) => response.data);
  },
  deleteTopic(id) {
    return apiClient.delete(`/admin/vocabulary/topics/${id}/`);
  },
  listTerms(params = {}) {
    return apiClient.get("/admin/vocabulary/terms/", { params }).then((response) => response.data);
  },
  saveTerm(id, payload) {
    const request = id
      ? apiClient.patch(`/admin/vocabulary/terms/${id}/`, payload)
      : apiClient.post("/admin/vocabulary/terms/", payload);
    return request.then((response) => response.data);
  },
  deleteTerm(id) {
    return apiClient.delete(`/admin/vocabulary/terms/${id}/`);
  },
  listGrammar(params = {}) {
    return apiClient.get("/admin/knowledge/grammar/", { params }).then((response) => response.data);
  },
  saveGrammar(id, payload) {
    const request = id
      ? apiClient.patch(`/admin/knowledge/grammar/${id}/`, payload)
      : apiClient.post("/admin/knowledge/grammar/", payload);
    return request.then((response) => response.data);
  },
  deleteGrammar(id) {
    return apiClient.delete(`/admin/knowledge/grammar/${id}/`);
  },
  listTips(params = {}) {
    return apiClient.get("/admin/knowledge/part-tips/", { params }).then((response) => response.data);
  },
  saveTip(id, payload) {
    const request = id
      ? apiClient.patch(`/admin/knowledge/part-tips/${id}/`, payload)
      : apiClient.post("/admin/knowledge/part-tips/", payload);
    return request.then((response) => response.data);
  },
  deleteTip(id) {
    return apiClient.delete(`/admin/knowledge/part-tips/${id}/`);
  },
  listExams(params = {}) {
    return apiClient.get("/admin/exams/", { params }).then((response) => response.data);
  },
  updateExam(id, payload) {
    return apiClient.patch(`/admin/exams/${id}/`, payload).then((response) => response.data);
  },
  listQuestions(params = {}) {
    return apiClient.get("/admin/questions/", { params }).then((response) => response.data);
  },
  updateQuestion(id, payload) {
    return apiClient.patch(`/admin/questions/${id}/`, payload).then((response) => response.data);
  },
};

export default adminService;
