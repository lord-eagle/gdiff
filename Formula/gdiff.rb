class Gdiff < Formula
  desc "Open the current repo's git diff as a side-by-side HTML view"
  homepage "https://github.com/lord-eagle/gdiff"
  url "https://github.com/lord-eagle/gdiff/archive/refs/heads/main.tar.gz"
  version "0.1.0"
  license "MIT"

  depends_on "node"
  depends_on "git"

  def install
    bin.install "bin/gdiff"
  end

  test do
    assert_match "gdiff", shell_output("#{bin}/gdiff --help")
  end
end
