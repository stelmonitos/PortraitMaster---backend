const Photo = require('../models/photo.model');
const Voter = require('../models/Voters.model');
const requestIp = require('request-ip');


/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
    const fileExt = fileName.split('.').slice(-1)[0]

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate email format
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format.');
    }

    if (title && author && email && file && fileName && (fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') && title.length <= 25 && author.length <= 50) { // if fields are not empty...
      const newPhoto = new Photo({ title: title.replace(/</g, "&lt;").replace(/>/g, "&gt;"), author: author.replace(/</g, "&lt;").replace(/>/g, "&gt;"), email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    } else {
      throw new Error('Title and author can\'t be longer than 50 characters.');
    }


  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const ip = requestIp.getClientIp(req);
      let voter = await Voter.findOne({ user: ip })

      if (!voter) {
        voter = new Voter({ user: ip, votes: [req.params.id] })
        await voter.save();
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        if(voter.votes.includes(req.params.id)){
          res.status(500).json({ message: 'you voted already ;P' })
        } else {
          voter.votes.push(req.params.id);
          await voter.save();
          photoToUpdate.votes++;
          await photoToUpdate.save();
          res.send({ message: 'OK' });
        }
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }

};
