
export function testSameOrigin(url: string) {

    var loc = window.location,
        a = document.createElement('a');

    a.href = url;

    return a.hostname == loc.hostname &&
        a.port == loc.port &&
        a.protocol == loc.protocol;
}


export function updateUrlIfYoutube(url: string) {
    var youtubeIdRegex = /(youtube\.com\/([^\/]+\/.+\/|(v|e(mbed)?)\/|.*[?&]v=)|youtu\.be\/)(?<id>[a-zA-Z0-9]{11})/gi;
    var id = youtubeIdRegex.exec(url)
    if (id) {
        return `https://www.youtube.com/embed/${id.groups['id']}`;
    }
    return url;
}
