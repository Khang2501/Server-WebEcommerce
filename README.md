# API ExpressJS

## Giới thiệu

API được xây dựng nhầm cung cấp các chức năng danh cho trang web:
https://server-web-ecommerce.vercel.app/
và trang web admin:
https://admin-ecommerce-murex.vercel.app/

## Cài đặt

1. Sao chép repository về máy tính của em
2. Mở terminal và di chuyển đến thư mục dự án
3. Chạy lệnh sau để cài đặt các gói phụ thuộc:
   npm install
4. Đảm bảo rằng máy tính của em đã cài đặt NodeJS và MongoDB.

## Sử dụng

- Chạy lệnh sau để khởi động API:
  npm start
- Mở trình duyệt và truy cập vào đường dẫn http://localhost:5000 để xem giao diện API

## Các Endpoint

1. **POST /register**: Thêm người dùng mới.
2. **POST /login**: Đăng nhập
3. **POST /loginAdmin**: Đăng nhập dành cho admin
4. **POST /addToCart**: Thêm sản phẩm vào giỏ hàng
5. **POST /getCart**: Xem danh sách giỏ hàng
6. **POST /updateCart**: Cập nhật giỏ hàng
7. **POST /sendMailConfirm**: Gửi mail xác nhận đã đặt hàng
8. **POST /getChats**: Lấy danh sách tin nhắn
9. **GET /product/prodCate/:category**: Lấy danh sách sản phẩm theo category.
10. **GET /product/prodCate/:id**: Lấy danh sách sản phẩm theo id sản phẩm.
11. **POST /product/updated-product**: Cập nhật sản phẩm.
12. **POST /product/deleted-product**: Xóa sản phẩm.
13. **POST /history**: Lấy lịch sử giao dịch (Client).
14. **POST /historyAdmin**: Lấy tất cả lịch sử giao dịch (admin).
