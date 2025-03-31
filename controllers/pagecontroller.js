

const getIndexPage = (req, res) => {
    res.render("index", {message: req.query.message})
}

const getGuncelYazilarPage = (req, res) => {
    res.render("guncel-yazilar")
}

const getKategorilerPage = (req, res) => {
    res.render("kategoriler"); // 
};

const getAllPhotos = (req, res) => {
    res.render("allphotos"); // 
};

const getHakkimPage = (req, res) => {
    res.render("hakkimda"); // 
};

const getCalismalarPage = (req, res) => {
    res.render("calismalar")
}

const  getChatPage = (req, res) => {
    res.render("chat")
}

export {getIndexPage, getGuncelYazilarPage, getKategorilerPage, getAllPhotos, getHakkimPage, getCalismalarPage, getChatPage}