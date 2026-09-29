import microservices from './topics/microservices.js'
import microservicesKafka from './topics/microservices-kafka.js'
import microservicesDocker from './topics/microservices-docker.js'
import microservicesKubernetes from './topics/microservices-kubernetes.js'

const microservicesTopics = [
  microservices,
  microservicesKafka,
  microservicesDocker,
  microservicesKubernetes,
]

export default microservicesTopics
