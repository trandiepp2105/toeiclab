import React from "react";

import VocabularyHomePage from "../VocabularyHomePage/VocabularyHomePage";

/**
 * Route alias cho màn hình danh sách chủ đề từ vựng.
 *
 * Giữ tên page theo template nhưng dùng chung implementation của
 * VocabularyHomePage để tránh nhân đôi logic tải và lọc topic.
 */
function TopicListPage(props) {
  return <VocabularyHomePage {...props} />;
}

export default TopicListPage;
