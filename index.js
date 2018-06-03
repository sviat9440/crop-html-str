const tags = /(^h[0-9]+$)|(^b$)|(^strong$)|(^i$)|(^p$)/i;
const tagImg = /(^img$)/i;
const tagA = /(^a$)/i;

class Entity {
    constructor(body, parents) {
        this.body = body;
        this.parents = parents;
    }

    get length() {
        return this.body.length;
    }

    get type() {
        return "entity";
    }
}

class EntityIMG extends Entity{
    constructor(src, parents) {
        super("", parents);
        this.src = src;
    }

    get type() {
        return "entityIMG";
    }
}

class EntityA extends Entity{
    constructor(body, href, parents) {
        super(body, parents);
        this.href = href;
    }

    get type() {
        return "entityA";
    }
}

const HTMLCompress = (html) => {
    html = html.replace(/(\r\n|\n|\r|\t)/gm,"");
    html = html.replace(/\s+/g," ");
    return html;
};

const HTMLToNode = (html) => {
    const p = document.createElement("p");
    p.innerHTML = HTMLCompress(html);
    return p;
};

const CropHTMLJS = (html, maxLength, allowImage, endStr) => {
    if (!endStr) endStr = "...";
    const obj = HTMLToNode(html);
    html = "";
    let lenght = 0;
    let openedTags = [];
    function openTag(tagName) {
        tagName = tagName.toLowerCase();
        openedTags.push(tagName);
        html += "<" + tagName + ">";
    }
    function closeTags(i) {
        for (let c = openedTags.length - i; c > 0; c --) {
            const tagName = openedTags[openedTags.length - 1];
            openedTags = openedTags.slice(0, openedTags.length - 1);
            html += "</" + tagName + ">";
        }
    }
    function openTags(tags) {
        for (let i = 0; i < tags.length; i ++) {
            openTag(tags[i]);
        }
    }
    function procTags(tags) {
        let i = 0;
        while (i < tags.length && i < openedTags.length) {
            if (tags[i].toLowerCase() !== openedTags[i].toLowerCase()) break;
            i ++;
        }
        closeTags(i);
        openTags(tags.slice(i));
    }
    function procEntity(entity) {
        if (lenght >= maxLength) return false;
        if (entity.type === "entity") {
            procTags(entity.parents);
            let text = entity.body;
            if (lenght + text.length > maxLength) {
                text = text.slice(0, maxLength - lenght) + endStr;
            }
            lenght += text.length;
            html += text;
            return lenght < maxLength;
        } else if (entity.type === "entityIMG") {
            if (!allowImage) return true;
            procTags(entity.parents);
            html += '<img src="' + entity.src + '">';
            lenght ++;
        } else if (entity.type === "entityA") {
            procTags(entity.parents);
            let text = entity.body;
            if (lenght + text.length > maxLength) {
                text = text.slice(0, maxLength - lenght) + endStr;
            }
            lenght += text.length;
            html += '<a href="' + entity.href + '">' + text + "</a>";
        }
        return true;
    }
    function parse(obj, parents) {
        if (obj.nodeType === Node.TEXT_NODE) {
            let text = obj.textContent;
            // if (text[0] === " ") {
            //     text = text.slice(1)
            // }
            // if (text.length > 0 && text[text.length - 1] === " ") {
            //     text = text.slice(0, text.length - 1)
            // }
            // if (text.length === 0) return true;
            return procEntity(new Entity(text, parents))
        }
        else if (tags.test(obj.nodeName)) {
            const p = parents.slice(0);
            p.push(obj.nodeName);
            for (let i = 0; i < obj.childNodes.length; i++) {
                if (!parse(obj.childNodes[i], p)) break;
            }
        }
        else if (tagImg.test(obj.nodeName) && allowImage) {
            return procEntity(new EntityIMG(obj.getAttribute("src"), parents))
        }
        else if (tagA.test(obj.nodeName)) {
            return procEntity(new EntityA(obj.innerText, obj.getAttribute("href"), parents))
        }
        // else {
        //     console.log(obj.nodeName, obj.nodeType);
        // }
        return true;
    }
    parse(obj, []);
    procTags([]);

    return html;
};