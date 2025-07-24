// Import marked from "marked"
import marked from "marked"

class MarkdownSPA {
  constructor() {
    this.currentPath = ""
    this.pathPrefix = window.pathPrefix || ""
    this.init()
  }

  init() {
    // Fix JS path for GitHub Pages
    if (this.pathPrefix) {
      // Update any dynamic script loading if needed
      console.log("Path prefix detected:", this.pathPrefix)
    }

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

  // Xử lý route cho content (/open/{type}/{name})
  async handleContentRoute(path) {
    const pathParts = path.split("/").filter((part) => part !== "")

    if (pathParts.length !== 3 || pathParts[0] !== "open") {
      this.showError("URL không hợp lệ. Định dạng đúng: /open/{type}/{name}")
      return
    }

    const [, type, name] = pathParts

    // Kiểm tra type hợp lệ
    if (!["privacy-policy", "contact-us"].includes(type)) {
      this.showError("Type không hợp lệ. Chỉ hỗ trợ: privacy-policy, contact-us")
      return
    }

    // Hiển thị loading
    this.showLoading()

    try {
      // Tạo đường dẫn file
      const filePath = `${this.pathPrefix}data/${type}/${name}.md`

      // Load và hiển thị nội dung
      await this.loadAndDisplayMarkdown(filePath, name, type)
    } catch (error) {
      console.error("Error loading markdown:", error)

      // Nếu file không tồn tại, hiển thị 404
      if (error.message.includes("File không tồn tại")) {
        await this.show404Page()
      } else {
        this.showError(`Không thể tải file: ${error.message}`)
      }
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

  // Hiển thị trang 404
  async show404Page() {
    try {
      const filePath = `${this.pathPrefix}data/404.md`
      const response = await fetch(filePath)

      let content404
      if (!response.ok) {
        content404 = `# 404 - Trang Không Tìm Thấy

Xin lỗi, trang bạn đang tìm kiếm không tồn tại.

[Về trang chủ](/)`
      } else {
        content404 = await response.text()
      }

      const htmlContent = marked.parse(content404)
      this.showContentPage(htmlContent, "404", "error", true)
    } catch (error) {
      this.showError("Không thể tải trang 404")
    }
  }

  // Hiển thị trang chủ
  showHomePage() {
    document.getElementById("home").classList.remove("hidden")
    document.title = "Policy & Contact Generator"
  }

  // Hiển thị trang nội dung
  showContentPage(htmlContent, name, type, is404 = false) {
    const contentDiv = document.getElementById("content")
    const markdownContentDiv = document.getElementById("markdown-content")
    const breadcrumbDiv = document.getElementById("breadcrumb-text")

    // Cập nhật breadcrumb
    let breadcrumbText
    if (is404) {
      breadcrumbText = "404 - Trang không tìm thấy"
    } else {
      const typeDisplay = type === "privacy-policy" ? "Privacy Policy" : "Contact Us"
      breadcrumbText = `${typeDisplay} / ${name}`
    }
    breadcrumbDiv.textContent = breadcrumbText

    // Cập nhật nội dung
    markdownContentDiv.innerHTML = htmlContent

    // Cập nhật title
    if (is404) {
      document.title = "404 - Trang không tìm thấy"
    } else {
      const typeDisplay = type === "privacy-policy" ? "Privacy Policy" : "Contact Us"
      document.title = `${typeDisplay} - ${name}`
    }

    // Hiển thị trang
    contentDiv.classList.remove("hidden")

    // Scroll to top
    window.scrollTo(0, 0)

    // Fix relative links trong markdown content
    this.fixRelativeLinks(markdownContentDiv)
  }

  // Fix các link tương đối trong markdown content
  fixRelativeLinks(container) {
    const links = container.querySelectorAll('a[href^="/"]')
    links.forEach((link) => {
      const href = link.getAttribute("href")
      if (href.startsWith("/open/")) {
        // Đây là internal link, không cần thay đổi
        link.addEventListener("click", (e) => {
          e.preventDefault()
          this.navigateTo(href)
        })
      }
    })
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

// Make navigateTo available globally
window.navigateTo = navigateTo

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  app = new MarkdownSPA()
})

// Export cho việc sử dụng module (nếu cần)
if (typeof module !== "undefined" && module.exports) {
  module.exports = MarkdownSPA
}
