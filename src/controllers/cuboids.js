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
  const cuboid = await Cuboid.query()
    .findById(req.params.id)
    .withGraphFetched('bag');
  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }
  const volume = cuboid.height * cuboid.width * cuboid.depth;
  return res.status(200).json({ ...cuboid, volume });
};

export const create = async (req, res) => {
  const { width, height, depth, bagId } = req.body;
  const requestedCapacity = width * height * depth;

  const bag = await Bag.query().findById(bagId);

  if (!bag.availableVolume || bag.availableVolume >= requestedCapacity) {
    const cuboid = await Cuboid.query().insert({
      width,
      height,
      depth,
      volume: requestedCapacity,
      bagId,
    });

    bag.availableVolume -= requestedCapacity;
    bag.payloadVolume += requestedCapacity;

    await Bag.query().updateAndFetchById(bag.id, {
      ...bag,
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
  const cuboid = await Cuboid.query()
    .findById(req.params.id)
    .withGraphFetched('bag');
  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  const deleted = await Cuboid.query().deleteById(cuboid.id);

  if (deleted) {
    return res.status(HttpStatus.OK);
  } else {
    return res.status(HttpStatus.NOT_FOUND);
  }
};
