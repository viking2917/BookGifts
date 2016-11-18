

function book_url (title, authorstring, bookid) {

    var title_for_url = normalize_string_for_url(title);
    var author_for_url  = normalize_string_for_url(authorstring);
    if (author_for_url == "") author_for_url = "unknown-author";

    var bookurl = "book/" + title_for_url +"--by--"+author_for_url+"--"+bookid;
    return bookurl;
}


function book_url_short (title, authorstring, bookid) {

    var title_for_url = normalize_string_for_url(title.substring(0,12));
    var author_terms = authorstring.split(" ");
    var author_for_url  = normalize_string_for_url(author_terms[author_terms.length-1]);
    if (author_for_url == "") author_for_url = "unknown-author";

    var bookurl = "book/" + title_for_url +"--by--"+author_for_url+"--"+bookid;
    return bookurl;
}

function normalize_string_for_url (string, do_quote) {

    if (typeof string == 'undefined'){
	console.log('undefined string in normalize_string');
	string = "";
    }

    if (typeof do_quote == 'undefined') {
	do_quote = true;
    }

    // dashes in strings (e.g. arturo perez-reverte) become _. - is separator. Undo the damage on server side for queries.

    var string_for_url = string.replace(/-/g, "_");
    string_for_url = string_for_url.replace(/ /g, "-");
    string_for_url = string_for_url.replace(/\//g, "-");
    string_for_url = string_for_url.replace(/:/g, "");
    string_for_url = string_for_url.replace(/,/g, "");
    string_for_url = string_for_url.replace(/#/g, "");
    string_for_url = string_for_url.replace(/\?/g, "");
    string_for_url = string_for_url.replace(/\%/g, "");
    string_for_url = string_for_url.replace(/\&/g, "");

    if(do_quote) string_for_url = string_for_url.replace(/'/g, "");

    return string_for_url;
}


module.exports.book_url = book_url;
module.exports.book_url_short = book_url_short;
