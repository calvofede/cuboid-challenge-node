import HttpStatus from 'http-status-codes';
import Cuboid from '../models/Cuboid';
import Bag from '../models/Bag';
import { byId } from './filters';

export const list = async (req, res) => {
  const cuboids = await Cuboid.query()
    .where(byId(req.query))
    .withGraphFetched('bag');
  return res.status(200).json(cuboids);
};

export const get = async (req, res) => {
  const cuboid = await Cuboid.query().where(req.params.id);
  return res.status(HttpStatus.OK).json(cuboid.id);
};

export const create = async (req, res) => {
  const { width, height, depth, bagId } = req.body;
  const requestedCapacity = width * height * depth;

  const bag = await Bag.query().findById(bagId);

  if (bag.volume >= requestedCapacity) {
    const cuboid = await Cuboid.query().insert({
      width,
      height,
      depth,
      bagId,
    });
    return res.status(HttpStatus.CREATED).json(cuboid);
  } else {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Insufficient capacity in bag' });
  }
};

export const update = async (req, res) => {
  const id = req.params.id;
  const { newWidth, newHeight, newDepth } = req.body;
  const newVolume = newWidth * newHeight * newDepth;

  const cuboid = await Cuboid.query().findById(id).withGraphFetched('bag');

  if (cuboid && cuboid.bag.volume >= newVolume) {
    const updatedCuboid = await Cuboid.query().updateAndFetchById(id, {
      width: newWidth,
      height: newHeight,
      depth: newDepth,
    });

    return res.status(HttpStatus.OK).json(updatedCuboid);
  }

  return res.status(HttpStatus.BAD_REQUEST).json({
    error: 'Bag volume must be equal or greather than requested cuboid volume',
  });
};

export const deleteCuboid = async (req, res) => {
  const id = req.params.id;

  const cuboid = await Cuboid.query().deleteById(id);

  if (cuboid) {
    return res.status(HttpStatus.OK);
  }
  return res.status(HttpStatus.NOT_FOUND);
};
