import React from "react";

import TestReviewPage from "../TestReviewPage/TestReviewPage";
import "./TestResultPage.scss";

/**
 * Trang kết quả bài thi.
 *
 * Kết quả và review dùng chung dữ liệu attempt; TestReviewPage đã chứa
 * cả phần tổng hợp điểm và danh sách đáp án nên route này tái sử dụng nó.
 */
function TestResultPage(props) {
  return <TestReviewPage {...props} />;
}

export default TestResultPage;
