export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO yyyy-mm-dd
  readMinutes: number;
  author: string;
  cover: string | null; // url or null -> placeholder
  body: string[]; // paragraphs
};

// Tạm thời dùng dữ liệu tĩnh — khi có backend thì thay bằng API.
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "5-thoi-quen-thu-gian-cuoi-ngay",
    title: "5 thói quen thư giãn cuối ngày giúp bạn ngủ ngon hơn",
    excerpt:
      "Một ngày dài không cần kết thúc bằng sự kiệt sức. Gợi ý 5 thói quen nhẹ nhàng giúp tâm trí lắng xuống trước khi đi ngủ.",
    category: "Chăm sóc bản thân",
    date: "2026-05-02",
    readMinutes: 5,
    author: "DiemSuong SPA",
    cover: null,
    body: [
      "Cuối một ngày dài, cơ thể và tâm trí cần được dỗ dành. Thay vì lập tức cuộn mình trên giường với màn hình điện thoại, hãy cho phép mình có một 'khoảng chuyển' để chậm lại.",
      "Đầu tiên là tắt bớt ánh sáng — chỉ giữ vài điểm sáng ấm. Não bộ rất nhạy với ánh sáng; giảm cường độ là tín hiệu rõ ràng rằng đã đến giờ nghỉ.",
      "Thứ hai, một ly nước ấm với chút gừng hoặc trà hoa cúc. Vị nóng nhẹ làm dịu hệ thần kinh và giúp cơ trơn của dạ dày thư giãn.",
      "Thứ ba, massage 5 phút ở vai và gáy. Bạn không cần kỹ thuật phức tạp — chỉ cần xoa nhẹ theo chiều kim đồng hồ. Hơi ấm bàn tay thôi đã đủ.",
      "Thứ tư, viết ra 3 điều biết ơn trong ngày. Thói quen nhỏ này giúp 'đóng lại' những suy nghĩ ngổn ngang.",
      "Cuối cùng, hít thở sâu — 4 giây hít vào, 6 giây thở ra, lặp lại 10 lần. Đơn giản nhưng hiệu quả bất ngờ.",
    ],
  },
  {
    slug: "huong-dan-doc-mui-tinh-dau",
    title: "Hướng dẫn 'đọc mùi' tinh dầu cho người mới bắt đầu",
    excerpt:
      "Tinh dầu không chỉ thơm — mỗi mùi gợi mở một trạng thái cảm xúc khác. Bài viết giúp bạn chọn được mùi hợp với mình.",
    category: "Tinh dầu",
    date: "2026-04-18",
    readMinutes: 7,
    author: "DiemSuong SPA",
    cover: null,
    body: [
      "Khi bước vào một spa, mùi hương là điều đầu tiên chào đón bạn. Mùi không chỉ làm dễ chịu — nó dẫn dắt cảm xúc một cách tinh tế.",
      "Nhóm mùi citrus (cam ngọt, chanh, bưởi) thường gợi cảm giác tươi mới, phù hợp buổi sáng hoặc khi cần tỉnh táo.",
      "Nhóm mùi gỗ (cedarwood, sandalwood) tạo cảm giác vững chãi, lý tưởng để thiền hoặc đọc sách.",
      "Nhóm mùi hoa (oải hương, hoa hồng, hoa nhài) làm dịu hệ thần kinh — thường dùng trong các liệu trình thư giãn buổi tối.",
      "Mẹo nhỏ: đừng vội mua một chai tinh dầu chỉ vì nó 'sang'. Hãy ngửi trực tiếp, để mùi tan trên cổ tay vài phút rồi mới quyết định.",
    ],
  },
  {
    slug: "massage-da-nong-khac-gi-massage-thuong",
    title: "Massage đá nóng khác gì massage thường?",
    excerpt:
      "Hai liệu trình tưởng giống nhau nhưng cảm nhận hoàn toàn khác. Cùng khám phá cách đá nóng làm việc với cơ thể.",
    category: "Liệu trình",
    date: "2026-04-05",
    readMinutes: 6,
    author: "DiemSuong SPA",
    cover: null,
    body: [
      "Massage truyền thống tác động đến cơ qua áp lực của bàn tay. Massage đá nóng cộng thêm yếu tố nhiệt — và đó là sự khác biệt.",
      "Nhiệt giúp giãn cơ nhanh hơn, máu lưu thông đều hơn. Những điểm co cứng lâu ngày sẽ dễ buông ra hơn so với massage thông thường.",
      "Đá được làm ấm ở nhiệt độ kiểm soát, sau đó kỹ thuật viên di chuyển theo các đường kinh lạc. Cảm giác đầu tiên thường là 'ấm dần', rồi 'tan ra'.",
      "Phù hợp cho ai? Người làm việc văn phòng, hay đau lưng — vai — gáy; người căng thẳng kéo dài; hoặc đơn giản là người muốn một trải nghiệm thư giãn sâu hơn.",
    ],
  },
  {
    slug: "lam-the-nao-de-cham-soc-da-mua-nong",
    title: "Làm thế nào để chăm sóc da khi Sài Gòn vào mùa nóng?",
    excerpt:
      "Nắng, gió, và bụi mịn — bộ ba 'khắc tinh' của làn da. Một vài lưu ý nhỏ để giữ da khoẻ trong những ngày oi nồng.",
    category: "Chăm sóc da",
    date: "2026-03-22",
    readMinutes: 4,
    author: "DiemSuong SPA",
    cover: null,
    body: [
      "Mùa nóng Sài Gòn không chỉ là vấn đề cảm giác — đó là một thách thức thật sự cho làn da. Tia UV mạnh, bụi mịn, và độ ẩm cao tạo nên môi trường khó khăn.",
      "Đầu tiên, đừng bỏ kem chống nắng. Ngay cả ngày trời âm u, tia UVA vẫn xuyên qua mây và làm tổn thương collagen.",
      "Thứ hai, uống đủ nước — 2 lít mỗi ngày là mức tối thiểu. Da khoẻ từ bên trong trước khi từ ngoài.",
      "Thứ ba, làm sạch kỹ vào buổi tối. Một bước rửa mặt thôi không đủ để gột hết kem chống nắng + bụi + dầu trong ngày.",
      "Và cuối cùng — cho da một liệu trình chăm sóc chuyên sâu định kỳ. Một buổi facial 60 phút mỗi 2 tuần đủ để giữ làn da bền vững qua mùa hè.",
    ],
  },
  {
    slug: "nhung-cau-hoi-thuong-gap-truoc-buoi-spa",
    title: "Những câu hỏi thường gặp trước buổi spa đầu tiên",
    excerpt:
      "Nên ăn trước hay sau? Mặc gì? Đến sớm bao nhiêu phút? Tổng hợp những băn khoăn phổ biến của khách lần đầu.",
    category: "Hướng dẫn",
    date: "2026-03-08",
    readMinutes: 3,
    author: "DiemSuong SPA",
    cover: null,
    body: [
      "Lần đầu đến spa, không ít người lúng túng. Đừng lo — dưới đây là vài điều chúng tôi thường được hỏi nhất.",
      "Nên ăn trước hay sau? Tốt nhất là ăn nhẹ trước 1 giờ. Không nên quá đói cũng không quá no.",
      "Mặc gì? Trang phục thoải mái. Chúng tôi sẽ cung cấp đồ riêng để thay khi vào liệu trình.",
      "Đến sớm bao nhiêu phút? 10-15 phút là đủ — bạn có thời gian thay đồ, trao đổi nhanh với kỹ thuật viên và bắt đầu đúng giờ.",
      "Có cần báo trước nếu mình có vấn đề sức khoẻ? Có. Hãy chia sẻ về dị ứng, đau lưng mãn tính, mang thai... để liệu trình được điều chỉnh phù hợp.",
    ],
  },
];

export function getPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}
