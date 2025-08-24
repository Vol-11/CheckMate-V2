import os
from quart import Quart, send_from_directory, abort

app = Quart(__name__)

# Quartが実行されたディレクトリを取得
BASE_DIR = os.getcwd()


@app.route('/')
async def index():
    """ルートアクセス時にindex.htmlを配信"""
    try:
        return await send_from_directory(BASE_DIR, 'index.html')
    except FileNotFoundError:
        abort(404)


@app.route('/<path:filepath>')
async def serve_file(filepath):
    """その他のパスを静的ファイルとして配信"""

    # リクエストされたパスを正規化
    requested_path = os.path.normpath(os.path.join(BASE_DIR, filepath))

    # セキュリティチェック: 実行ディレクトリより上の階層へのアクセスを禁止
    if not requested_path.startswith(BASE_DIR):
        abort(403)  # Forbidden

    try:
        return await send_from_directory(BASE_DIR, filepath)
    except FileNotFoundError:
        abort(404)


if __name__ == '__main__':
    print(f"静的ファイルサーバーを開始します: {BASE_DIR}")
    print("アクセス: http://localhost:5000")
    app.run(port=5000, debug=True)
