

export function updateUrlIfYoutube(url: string) {
    var youtubeIdRegex = /(youtube\.com\/([^\/]+\/.+\/|(v|e(mbed)?)\/|.*[?&]v=)|youtu\.be\/)(?<id>[a-zA-Z0-9_-]{11})/gi;
    var id = youtubeIdRegex.exec(url)
    if (id) {
        return `https://www.youtube.com/embed/${id.groups['id']}`;
    }
    return url;
}

export function isUrl(text: string): boolean {
    let urlRegex = new RegExp(
        "^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$"
    );
    return urlRegex.test(text);
}
