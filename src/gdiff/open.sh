if [ "${GDIFF_OPEN:-1}" = "0" ]; then
  echo "Open: $out"
  exit 0
fi

case "$(uname -s)" in
  Darwin) open "$out" ;;
  Linux)  xdg-open "$out" >/dev/null 2>&1 || echo "Open: $out" ;;
  *)      echo "Open: $out" ;;
esac
