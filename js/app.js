import marked from "marked"

class MarkdownSPA {
  constructor() {
    this.currentPath = ""
    this.init()
  }

  init() {
    // Xử lý routing khi trang load
    this.handleRoute()

    // Lắng nghe sự kiện popstate (back/forward button)
    window.addEventListener("popstate", () => {
      this.handleRoute()
    })

    // Xử lý click trên các link internal
    document.addEventListener("click", (e) => {
      if (e.target.matches('a[href^="#"]')) {
        e.preventDefault()
      }
    })
  }

  // Điều hướng đến path mới
  navigateTo(path) {
    if (path !== this.currentPath) {
      history.pushState(null, "", path)
      this.handleRoute()
    }
  }

  // Xử lý routing
  handleRoute() {
    const path = window.location.pathname
    this.currentPath = path

    // Ẩn tất cả các trang
    this.hideAllPages()

    if (path === "/" || path === "") {
      this.showHomePage()
    } else if (path.startsWith("/open/")) {
      this.handleContentRoute(path)
    } else {
      this.showError("Trang không tồn tại")
    }
  }

  // Xử lý route cho content (/open/{name}/{type})
  async handleContentRoute(path) {
    const pathParts = path.split("/").filter((part) => part !== "")

    if (pathParts.length !== 3 || pathParts[0] !== "open") {
      this.showError("URL không hợp lệ. Định dạng đúng: /open/{name}/{type}")
      return
    }

    const [, name, type] = pathParts

    // Kiểm tra type hợp lệ
    if (!["privacy-policy", "contact-us"].includes(type)) {
      this.showError("Type không hợp lệ. Chỉ hỗ trợ: privacy-policy, contact-us")
      return
    }

    // Hiển thị loading
    this.showLoading()

    try {
      // Tạo đường dẫn file
      const filePath = `./data/${type}/${name}.md`

      // Load và hiển thị nội dung
      await this.loadAndDisplayMarkdown(filePath, name, type)
    } catch (error) {
      console.error("Error loading markdown:", error)
      this.showError(`Không thể tải file: ${error.message}`)
    }
  }

  // Load và hiển thị markdown
  async loadAndDisplayMarkdown(filePath, name, type) {
    try {
      const response = await fetch(filePath)

      if (!response.ok) {
        throw new Error(`File không tồn tại: ${filePath}`)
      }

      const markdownText = await response.text()

      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownText)

      // Hiển thị nội dung
      this.showContentPage(htmlContent, name, type)
    } catch (error) {
      throw new Error(`Lỗi khi tải file: ${error.message}`)
    }
  }

  // Hiển thị trang chủ
  showHomePage() {
    document.getElementById("home").classList.remove("hidden")
    document.title = "Policy & Contact Generator"
  }

  // Hiển thị trang nội dung
  showContentPage(htmlContent, name, type) {
    const contentDiv = document.getElementById("content")
    const markdownContentDiv = document.getElementById("markdown-content")
    const breadcrumbDiv = document.getElementById("breadcrumb-text")

    // Cập nhật breadcrumb
    const typeDisplay = type === "privacy-policy" ? "Privacy Policy" : "Contact Us"
    breadcrumbDiv.textContent = `${name} / ${typeDisplay}`

    // Cập nhật nội dung
    markdownContentDiv.innerHTML = htmlContent

    // Cập nhật title
    document.title = `${typeDisplay} - ${name}`

    // Hiển thị trang
    contentDiv.classList.remove("hidden")

    // Scroll to top
    window.scrollTo(0, 0)
  }

  // Hiển thị loading
  showLoading() {
    document.getElementById("loading").classList.remove("hidden")
  }

  // Hiển thị lỗi
  showError(message) {
    const errorDiv = document.getElementById("error")
    const errorMessageDiv = document.getElementById("error-message")

    errorMessageDiv.textContent = message
    errorDiv.classList.remove("hidden")

    document.title = "Lỗi - Policy & Contact Generator"
  }

  // Ẩn tất cả các trang
  hideAllPages() {
    const pages = ["home", "content", "loading", "error"]
    pages.forEach((pageId) => {
      document.getElementById(pageId).classList.add("hidden")
    })
  }
}

// Khởi tạo ứng dụng
let app

// Hàm global để điều hướng (được gọi từ HTML)
function navigateTo(path) {
  if (app) {
    app.navigateTo(path)
  }
}

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  app = new MarkdownSPA()
})

// Export cho việc sử dụng module (nếu cần)
if (typeof module !== "undefined" && module.exports) {
  module.exports = MarkdownSPA
}
