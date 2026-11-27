import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'

// 隐私政策：与“拾忆人生”（私密生活记录 + 好友分享）应用的实际功能相符，
// 覆盖数据收集、用途、分享、存储与安全、删除账号、Cookie/本地存储、未成年人等要点。
// 注意：本页为通用中文政策文本，不构成法律意见；正式商用前建议请专业人士审阅。
// 联系方式未写具体邮箱——代码库中没有公开的联系邮箱，不编造，统一写“应用内反馈”。
export default function Privacy() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-stone-800 text-lg">拾忆人生</span>
          </Link>
          <Link to="/welcome" className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-terracotta-600">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-soft p-8 md:p-10">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">隐私政策</h1>
          <p className="text-sm text-stone-400 mb-8">最后更新：2026年11月26日</p>

          <div className="space-y-8 text-stone-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">一、我们收集哪些信息</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong className="text-stone-800">账号信息：</strong>
                  你注册时提供的邮箱地址、用户名，以及登录所必需的凭证信息（密码经加密存储，我们无法看到你的明文密码）。
                </li>
                <li>
                  <strong className="text-stone-800">你发布的内容：</strong>
                  你的日记文字、图片、评论、私信，以及你设置的可见范围（公开、好友可见或仅自己可见）和好友关系。
                </li>
                <li>
                  <strong className="text-stone-800">设备与使用信息：</strong>
                  为保障服务安全与正常运行，我们可能记录必要的技术信息，如登录时间、设备类型与浏览器信息。
                </li>
              </ul>
              <p className="mt-2">
                我们不会主动收集你的精确位置。首页天气卡片如需定位，仅在你授权浏览器定位后使用，
                未授权时默认显示深圳天气；定位信息仅用于获取天气，不会上传或保存到你的账号数据中。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">二、信息如何使用</h2>
              <p>我们仅将你的信息用于以下目的：</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>提供账号登录、内容存储与展示等核心服务；</li>
                <li>按你设置的可见范围，向你选择的好友展示你的分享内容；</li>
                <li>发送密码重置等与账号安全相关的邮件；</li>
                <li>排查故障、防范滥用，保障服务与账号安全。</li>
              </ul>
              <p className="mt-2">我们不会将你的个人信息出售给任何第三方，也不会用于与本服务无关的广告投放。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">三、信息的分享与公开</h2>
              <p>
                你的日记与动态默认仅你自己可见；只有当你主动选择“好友可见”或“公开”时，
                相应内容才会被你的好友或他人看到。你的私信仅参与对话的双方可见。
                除以下情形外，我们不会向第三方披露你的个人信息：
                法律法规要求，或为保护你、其他用户及公众的人身与财产安全所必需。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">四、存储与安全</h2>
              <p>
                你的数据存储在受保护的云服务中，并采取加密传输、访问控制等措施加以保护。
                但请理解，互联网传输与存储不存在绝对安全；请你妥善保管密码，不要在公共设备上保持登录状态。
                发现账号异常时，请及时修改密码并通过应用内反馈联系我们。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">五、你的权利：查看、删除与注销</h2>
              <p>
                你可以随时在应用内查看、编辑或删除自己发布的内容；删除的内容将不再向其他用户展示。
                如需删除账号及相关个人数据，请登录后通过应用内反馈联系我们，
                我们会在核实身份后处理（法律法规要求保留的内容除外）。
                删除账号后，与你相关的公开内容将一并移除，好友关系也随之解除。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">六、Cookie 与本地存储</h2>
              <p>
                为保持你的登录状态，应用会在浏览器本地保存必要的登录凭证；
                首页天气会在浏览器本地短暂缓存（约 30 分钟），以减少重复请求。
                清除浏览器数据后，你需要重新登录，天气缓存也会随之清除。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">七、未成年人保护</h2>
              <p>
                本服务主要面向成年人。未满 18 周岁的用户应在监护人同意与指导下使用，
                请勿自行提供个人敏感信息。如监护人发现未成年人未经同意注册了账号，
                可通过应用内反馈联系我们处理。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">八、政策的更新与联系方式</h2>
              <p>
                我们可能不时更新本政策，更新后会在本页面公布新的最后更新日期，
                继续使用服务即表示你接受更新后的政策。
                如对本政策有任何疑问，请登录后通过应用内反馈联系我们。
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-200 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl font-medium transition-colors"
            >
              返回注册
            </Link>
            <Link
              to="/welcome"
              className="px-6 py-3 text-stone-600 hover:text-terracotta-600 font-medium transition-colors"
            >
              返回首页
            </Link>
            <Link to="/terms" className="px-6 py-3 text-stone-600 hover:text-terracotta-600 font-medium transition-colors">
              查看服务条款
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
