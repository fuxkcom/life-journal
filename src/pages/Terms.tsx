import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'

// 服务条款：与“生活日志”（私密生活记录 + 好友分享）应用的实际功能相符。
// 注意：本页为通用中文条款文本，不构成法律意见；正式商用前建议请专业人士审阅。
// 联系方式未写具体邮箱——代码库中没有公开的联系邮箱，不编造，统一写“应用内反馈”。
export default function Terms() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-stone-800 text-lg">生活日志</span>
          </Link>
          <Link to="/welcome" className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-terracotta-600">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-soft p-8 md:p-10">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">服务条款</h1>
          <p className="text-sm text-stone-400 mb-8">最后更新：2026年11月26日</p>

          <div className="space-y-8 text-stone-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">一、服务内容</h2>
              <p>
                「生活日志」是一款私密生活记录应用。你可以记录文字与图片日志，邀请亲密好友加入你的圈子，
                与好友分享生活动态并进行私密对话。我们会尽力保持服务稳定可用，但不承诺服务永不中断或完全没有差错。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">二、账号注册与安全</h2>
              <p>
                注册时你需要提供真实有效的邮箱地址，并设置密码；用户名为 3–20 个字符。
                你应当妥善保管账号与密码，因账号被他人使用而产生的后果由你自行承担；
                如发现账号异常，请及时通过应用内反馈联系我们。你不得冒用他人身份注册，也不得将账号转让、出借给他人使用。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">三、你的内容与归属</h2>
              <p>
                你在应用中发布的日记、图片与评论等内容，其著作权仍归你所有。
                你发布内容即表示你拥有相关权利，不侵犯他人的著作权、肖像权、名誉权等合法权益。
                为实现“记录与好友分享”的服务功能，你授权我们在提供服务所必需的范围内存储、展示你的内容，
                该授权随你删除相应内容或注销账号而终止。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">四、好友分享与隐私范围</h2>
              <p>
                你发布内容时可自行选择可见范围（公开、好友可见或仅自己可见）。
                请注意：设为好友可见或公开的内容，你的好友或他人可以看到并可能转发、保存，
                请勿发布你不希望被他人知晓的敏感信息。你邀请好友时，请确保对方同意加入你的圈子。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">五、合理使用</h2>
              <p>使用本服务时，你不得：</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>发布违法、有害、淫秽、诽谤、侵权或侵犯他人隐私的内容；</li>
                <li>发布垃圾信息、广告或进行骚扰、欺诈等行为；</li>
                <li>尝试攻击、破坏服务，或以自动化手段批量抓取他人内容；</li>
                <li>以任何方式干扰其他用户正常使用本服务。</li>
              </ul>
              <p className="mt-2">
                违反上述规定的，我们有权视情节采取删除内容、限制功能或封禁账号等措施。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">六、服务的变更与终止</h2>
              <p>
                我们可能根据需要调整或升级服务功能，重大变更会提前在应用内告知。
                你可以随时停止使用本服务；如需删除账号，请通过应用内反馈联系我们，
                我们会在核实身份后删除你的账号及相关个人数据（法律法规要求保留的除外）。
                我们也有权在你严重违反本条款时暂停或终止向你提供服务。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">七、免责声明</h2>
              <p>
                本服务按“现状”提供。你自行决定发布与分享的内容，并对内容的真实性、合法性负责；
                因你发布的内容引发的纠纷，由你自行处理。因不可抗力、第三方服务故障等非我们可控原因导致的服务中断，
                我们不承担责任，但会尽力尽快恢复。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">八、条款的修改与联系方式</h2>
              <p>
                我们可能不时更新本条款，更新后会在本页面公布新的最后更新日期，继续使用服务即表示你接受更新后的条款。
                如对本条款有任何疑问，请登录后通过应用内反馈联系我们。
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
            <Link to="/privacy" className="px-6 py-3 text-stone-600 hover:text-terracotta-600 font-medium transition-colors">
              查看隐私政策
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
