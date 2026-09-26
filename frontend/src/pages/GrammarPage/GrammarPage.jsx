import React from "react";
import KnowledgePage from "../../components/knowledge/KnowledgePage/KnowledgePage";
import "./GrammarPage.scss";

/**
 * Trang kiến thức ngữ pháp, dùng chung KnowledgePage với mode grammar.
 */
function GrammarPage() {
  return <KnowledgePage kind="grammar" />;
}

export default GrammarPage;
