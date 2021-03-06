import { TouchSwipe } from "quasar";
import Hammer from "hammerjs";
const ePub = window.ePub;


export default {
  init() {
    const el = this.$refs.content;
    const computedStyle = window.getComputedStyle(el);
    const handbookFolder = "./statics/docs/afh1/";

    this.book = ePub(handbookFolder, {
      width: computedStyle.width,
      height: computedStyle.height,
      styles: {
        paddingRight: "15px"
      }
    });

    this.book.renderTo("content").then(() => this.onBookReady());
  },
  onBookReady() {
    let path = "../../ebook.css";
    window.EPUBJS.core.addCss(path, null, this.book.renderer.doc.head);

    this.book.forceSingle();
    this.book.on("renderer:chapterDisplayed", this.appendHandlers);
    this.book.on("renderer:locationChanged", this.locationChangeHandler);
    this.$store.commit("setBook", this.book);
    if (this.$route.params.cfi) {
      this.gotoCfi(`epubcfi(${this.$route.params.cfi.replace(/-/g, "/")})`);
    }
    const win = document.querySelector("iframe").contentWindow;
    this.removeContextMenu(win);
    this.removeContextMenu(window);
    this.book.getToc().then((chapters) => {
      chapters.forEach((chapter) => {
        this.$store.commit("addChapter", chapter);
      });
    });
    this.$store.dispatch("generatePagination");
  },
  appendHandlers() {
    const iframe = document.querySelector("iframe");

    iframe.contentDocument.addEventListener("selectionchange", () => {
      if (iframe.contentWindow.getSelection().toString().length) {
        setTimeout(() => {
          if (iframe.contentWindow.getSelection().toString().length) {
            this.isTextSelectable = true;
          }
        }, 250);
      } else {
        this.isTextSelectable = false;
      }
    });
    setTimeout(()=>{this.appendSwipeHandler()},500);

  },
  appendSwipeHandler(){

    const iframe = document.querySelector('iframe');
    const doc = iframe.contentDocument;
    doc.body.style.height = "100%";
    this.$store.commit("saveLastLocation");
    if(doc.body._swipeHandled) return;
    doc.body._swipeHandled = true;
    delete Hammer.defaults.cssProps.userSelect;
    let hammer = new Hammer(doc.body);
    hammer.on("swipe", (e)=>{
      if(e.direction === 2){
        this.book.nextPage();
      } else if(e.direction === 4){
        this.book.prevPage();
      }
    });
    return;

  },
  locationChangeHandler(location) {
    this.appendHandlers();
    const win = document.querySelector("iframe").contentWindow;
    win.getSelection().removeAllRanges();
    this.removeContextMenu(win);
    this.removeContextMenu(window);
    this.currentCfi = location.replace(/\//g, "-");
    setTimeout(() => this.markHighlights(), 50);
    this.isToolbarHidden = true;
    this.$store.commit("saveLastLocation");
  },

  removeContextMenu(win) {
    win.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
  }
};
